import { View } from 'ui/core/view';
export type WaveformType = 'mic' | 'file';

export interface IWaveformModel {
    readonly target: any;
    dispose(): void;
}

export interface IWaveform extends View {
    type: WaveformType;
    model: IWaveformModel;
    createNativeView(): any;
    initNativeView(): void;
    disposeNativeView(): void;
}