import { Component } from "@angular/core";

// nativescript
import { isIOS } from 'platform';
import { topmost } from 'ui/frame';
import * as app from 'application';
import { Page } from "ui/page";

import './operators';

// app
import { AuthService } from './modules/core/services';

declare var android;

@Component({
    selector: 'my-app',
    templateUrl: 'app.component.html',
})
export class AppComponent {
    constructor(
        private authService: AuthService,
        page: Page
    ) {
        if (isIOS) {
            /**
            * 0 = black text
            * 1 = white text
            */
            topmost().ios.controller.navigationBar.barStyle = 1;
        } else {
            // adjust text to darker color
            let decorView = app.android.startActivity.getWindow().getDecorView();
            decorView.setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }
    }
}