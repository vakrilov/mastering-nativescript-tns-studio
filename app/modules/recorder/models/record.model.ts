import { Observable } from 'data/observable';
import { knownFolders } from 'file-system';
import { IRecordModel, IRecordEvents, RecordState, documentsFilePath } from
    './common';

export class RecordModel extends Observable implements IRecordModel {
    // available events to listen to
    private _events: IRecordEvents;

    // control nodes
    private _mic: AKMicrophone;
    private _micBooster: AKBooster;
    private _recorder: AKNodeRecorder;

    // mixers
    private _micMixer: AKMixer;
    private _mainMixer: AKMixer;

    // state
    private _state: number = RecordState.readyToRecord;

    // the final saved path to use
    private _savedFilePath: string;

    public get target() {
        return this._mic;
    }

    constructor() {
        super();
        // setup the event names
        this._setupEvents();

        // setup recording environment
        // clean any tmp files from previous recording sessions
        (<any>AVAudioFile).cleanTempDirectory();

        // audio setup
        AKSettings.setBufferLength(BufferLength.Medium);
        try {
            // ensure audio session is PlayAndRecord
            // allows mixing with other tracks while recording
            AKSettings.setSessionWithCategoryOptionsError(
                SessionCategory.PlayAndRecord,
                AVAudioSessionCategoryOptions.DefaultToSpeaker
            );
        } catch (err) {
            console.log('AKSettings error:', err);
        }

        // setup mic with it's own mixer
        this._mic = AKMicrophone.alloc().init();
        this._micMixer = AKMixer.alloc().init(null);
        this._micMixer.connect(this._mic);

        // Helps provide mic monitoring when headphones are plugged in
        this._micBooster = AKBooster.alloc().initGain(<any>this._micMixer, 0);
        try {
            // recorder takes the micMixer input node
            this._recorder = AKNodeRecorder.alloc()
                .initWithNodeFileError(<any>this._micMixer, null);
        } catch (err) {
            console.log('AKNodeRecorder init error:', err);
        }
        // overall main mixer uses micBooster
        this._mainMixer = AKMixer.alloc().init(null);
        this._mainMixer.connect(this._micBooster);
        // single output set to mainMixer
        AudioKit.setOutput(<any>this._mainMixer);
        // start the engine!
        AudioKit.start();
    }
    public get events(): IRecordEvents {
        return this._events;
    }
    public get mic(): AKMicrophone {
        return this._mic;
    }
    public get recorder(): AKNodeRecorder {
        return this._recorder;
    }
    public get audioFilePath(): string {
        if (this._recorder) {
            return this._recorder.audioFile.url.absoluteString;
        }
        return '';
    }
    public get state(): number {
        return this._state;
    }
    public set state(value: number) {
        this._state = value;
        // always emit state changes
        this._emitEvent(this._events.stateChange, this._state);
    }
    public get savedFilePath() {
        return this._savedFilePath;
    }
    public set savedFilePath(value: string) {
        this._savedFilePath = value;
        if (this._savedFilePath)
            this.state = RecordState.saved;
    }
    public toggleRecord() {
        if (this._state !== RecordState.recording) {
            // just force ready to record
            // when coming from any state other than recording
            this.state = RecordState.readyToRecord;
            if (this._recorder) {
                try {
                    // resetting (clear previous recordings)
                    this._recorder.resetAndReturnError();
                } catch (err) {
                    console.log('Recorder reset error:', err);
                }
            }
        }
        switch (this._state) {
            case RecordState.readyToRecord:
                if (AKSettings.headPhonesPlugged) {
                    // Microphone monitoring when headphones plugged
                    this._micBooster.gain = 1;
                }
                try {
                    this._recorder.recordAndReturnError();
                    this.state = RecordState.recording;
                } catch (err) {
                    console.log('Recording failed:', err);
                }
                break;
            case RecordState.recording:
                this.state = RecordState.readyToPlay;
                this._recorder.stop();
                // Microphone monitoring muted when playing back
                this._micBooster.gain = 0;
                break;
        }
    }

    public togglePlay() {
        if (this._state === RecordState.readyToPlay) {
            this.state = RecordState.playing;
        } else {
            this.stopPlayback();
        }
    }

    public stopPlayback() {
        if (this.state !== RecordState.recording) {
            this.state = RecordState.readyToPlay;
        }
    }

    public save() {
        let fileName = `recording-${Date.now()}.m4a`;
        this._recorder.audioFile
            .exportAsynchronouslyWithNameBaseDirExportFormatFromSampleToSampleCallback(
            fileName, BaseDirectory.Documents, ExportFormat.M4a, null, null,
            (af: AKAudioFile, err: NSError) => {
                this.savedFilePath = documentsFilePath(fileName);
            });
    }

    public finish() {
        this.state = RecordState.finish;
    }

    public dispose() {
        AudioKit.stop();
        // cleanup
        this._mainMixer = null;
        this._recorder = null;
        this._micBooster = null;
        this._micMixer = null;
        this._mic = null;
        // clean out tmp files
        (<any>AVAudioFile).cleanTempDirectory();
    }


    private _emitEvent(eventName: string, data?: any) {
        let event = {
            eventName,
            data,
            object: this
        };
        this.notify(event);
    }
    private _setupEvents() {
        this._events = {
            stateChange: 'stateChange'
        };
    }
}