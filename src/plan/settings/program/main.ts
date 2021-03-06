import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {RestModule} from 'core/rest';

import {ProgramSettingsComponent} from './program-settings.component';
import {ProgramSettingsModule} from './program-settings.module';
import {ProgramSettingsService} from './program-settings.service';

@NgModule({
    bootstrap: [ProgramSettingsComponent],
    imports: [
        BrowserModule,
        ProgramSettingsModule,
        RestModule.for('/api/plan/settings/programs'),
    ],
    providers: [
        ProgramSettingsService,
        {provide: 'SCHEME_TEMPLATES_URL', useValue: '/api/plan/schemeTemplates'},
    ],
})
class MainModule {}

platformBrowserDynamic().bootstrapModule(MainModule);
