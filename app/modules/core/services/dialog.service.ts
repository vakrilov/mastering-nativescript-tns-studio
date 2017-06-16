// angular
import {
    Injectable, NgModuleFactory, NgModuleFactoryLoader,
    ViewContainerRef, NgModuleRef
} from '@angular/core';

// nativescript
import * as dialogs from 'ui/dialogs';
import { ModalDialogService } from 'nativescript-angular/directives/dialogs';

@Injectable()
export class DialogService {
    constructor(
        private moduleLoader: NgModuleFactoryLoader,
        private modalService: ModalDialogService
    ) { }

    public openModal(componentType: any, vcRef: ViewContainerRef, context?:
        any, modulePath?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const launchModal = (moduleRef?: NgModuleRef<any>) => {
                this.modalService.showModal(componentType, {
                    moduleRef,
                    viewContainerRef: vcRef,
                    context
                }).then(resolve, reject);
            };
            if (modulePath) {
                // lazy load module which contains component to open in modal
                this.moduleLoader.load(modulePath)
                    .then((module: NgModuleFactory<any>) => {
                        launchModal(module.create(vcRef.parentInjector));
                    });
            } else {
                // open component in modal known to be available without lazy loading
                launchModal();
            }
        });
    }

    public alert(msg: string) {
        return dialogs.alert(msg);
    }
    public confirm(msg: string) {
        return dialogs.confirm(msg);
    }
    public prompt(msg: string, defaultText?: string) {
        return dialogs.prompt(msg, defaultText);
    }
    public login(msg: string, userName?: string, password?: string) {
        return dialogs.login(msg, userName, password);
    }
    public action(msg: string, cancelButtonText?: string,
        actions?: string[]) {
        return dialogs.action(msg, cancelButtonText, actions);
    }
}