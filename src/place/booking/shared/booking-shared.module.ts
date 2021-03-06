import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {CommonDirectivesModule} from 'core/common-directives';
import {BookingFormViewerComponent} from './form-viewer.component';

export {
    BookingFormViewerComponent,
};

@NgModule({
    imports: [
        CommonModule,
        CommonDirectivesModule,
    ],
    declarations: [
        BookingFormViewerComponent,
    ],
    exports: [
        BookingFormViewerComponent,
    ],
})
export class BookingSharedModule {}
