import { View } from 'ui/core/view';
import { Color } from 'color';
import { Subscription } from 'rxjs/Subscription';
import { IWaveform, IWaveformModel, WaveformType, Waveform as WaveformDefinition } from './waveform';

const GLSurfaceView = android.opengl.GLSurfaceView;
const AudioRecord = android.media.AudioRecord;
// Horizon recorder waveform
// https://github.com/Yalantis/Horizon
declare var com;
const Horizon = com.yalantis.waves.util.Horizon;
const AudioUtil = com.yalantis.audio.lib.AudioUtil;

// various recorder settings
const RECORDER_SAMPLE_RATE = 44100;
const RECORDER_CHANNELS = 1;
const RECORDER_ENCODING_BIT = 16;
const RECORDER_AUDIO_ENCODING = 3;
const MAX_DECIBELS = 120;

// Semantive waveform for files
// https://github.com/Semantive/waveform-android
const WaveformView = com.semantive.waveformandroid.waveform.view.WaveformView;
const CheapSoundFile = com.semantive.waveformandroid.waveform.soundfile.CheapSoundFile;
const ProgressListener = com.semantive.waveformandroid.waveform.soundfile.CheapSoundFile.ProgressListener;

export class Waveform extends View implements IWaveform, WaveformDefinition {
    private _model: IWaveformModel;
    private _type: WaveformType;
    private _initialized: boolean;
    private _horizon: any;
    private _javaByteArray: Array<any>;
    private _waveformFileView: any;
    private _sub: Subscription;
    public set type(value: WaveformType) {
        this._type = value;
    }
    public get type() {
        return this._type;
    }
    public set model(value: IWaveformModel) {
        this._model = value;
        this._initView();
    }
    public get model() {
        return this._model;
    }
    createNativeView() {
        switch (this.type) {
            case 'mic':
                this.nativeView = new GLSurfaceView(this._context);
                this.height = 200; // GL view needs height
                break;
            case 'file':
                this.nativeView = new WaveformView(this._context, null);
                break;
        }
        return this.nativeView;
    }
    initNativeView() {
        this._initView();
    }
    disposeNativeView() {
        if (this.model && this.model.dispose) this.model.dispose();
    }
    private _initView() {
        if (!this._initialized && this.nativeView && this.model) {
            if (this.type === 'mic') {
                this._initialized = true;
                this._horizon = new Horizon(
                    this.nativeView,
                    new Color('#000').android,
                    RECORDER_SAMPLE_RATE,
                    RECORDER_CHANNELS,
                    RECORDER_ENCODING_BIT
                );
                this._horizon.setMaxVolumeDb(MAX_DECIBELS);
                let bufferSize = 2 * AudioRecord.getMinBufferSize(
                    RECORDER_SAMPLE_RATE, RECORDER_CHANNELS,
                    RECORDER_AUDIO_ENCODING);
                this._javaByteArray = Array.create('byte', bufferSize);
                this._sub = this._model.target.subscribe((value) => {
                    this._javaByteArray[ 0 ] = value;
                    this._horizon.updateView(this._javaByteArray);
                });
            } else {
            }
        }
    }
}