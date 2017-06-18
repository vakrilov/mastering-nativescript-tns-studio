import { View } from 'ui/core/view';
import { Color } from 'color';
import { IWaveform, IWaveformModel, WaveformType } from './common';

export class Waveform extends View implements IWaveform {
    private _model: IWaveformModel;
    private _type: WaveformType;
    private _plotColor: string;
    private _fill: boolean;
    private _mirror: boolean;
    private _plotType: string;

    public set type(value: WaveformType) {
        this._type = value;
    }
    public get type() {
        return this._type;
    }
    public set model(value: IWaveformModel) {
        this._model = value;
    }
    public get model() {
        return this._model;
    }

    createNativeView() {
        switch (this.type) {
            case 'mic':
                this.nativeView = AKNodeOutputPlot.alloc()
                    .initFrameBufferSize(this._model.target, CGRectMake(0, 0, 0, 0),
                    1024);
                break;
            case 'file':
                this.nativeView = EZAudioPlot.alloc().init();
                break;
        }
        return this.nativeView;
    }

    initNativeView() {
        // trigger setters
        this.plotColor = this._plotColor;
        this.fill = this._fill;
        this.mirror = this._mirror;
        this.plotType = this._plotType;
        if (this._type === 'file') {
            // init file with the model's target
            // target should be absolute url to path of file
            let file = EZAudioFile.alloc()
                .initWithURL(NSURL.fileURLWithPath(this._model.target));
            // render the file's data as a waveform
            let data = file.getWaveformData();
            (<EZAudioPlot>this.nativeView)
                .updateBufferWithBufferSize(data.buffers[ 0 ], data.bufferSize);
        }
    }

    disposeNativeView() {
        if (this.model && this.model.dispose) this.model.dispose();
    }

    set plotColor(value: string) {
        this._plotColor = value;
        if (this._plotColor && this.nativeView)
            this.nativeView.color = new Color(this._plotColor).ios;
    }

    set fill(value: boolean) {
        this._fill = value;
        if (this.nativeView)
            this.nativeView.shouldFill = !!this._fill;
    }

    set mirror(value: boolean) {
        this._mirror = value;
        if (this.nativeView)
            this.nativeView.shouldMirror = !!this._mirror;
    }

    set plotType(type: string) {
        this._plotType = type;
        if (this.nativeView) {
            switch (this._plotType) {
                case 'buffer':
                    this.nativeView.plotType = EZPlotType.Buffer;
                    break;
                case 'rolling':
                    this.nativeView.plotType = EZPlotType.Rolling;
                    break;
            }
        }
    }
}