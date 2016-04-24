import {bootstrap} from 'angular2/platform/browser';
import {provide, Component, ElementRef, OnInit} from 'angular2/core';

import {REST_PROVIDERS, API_URL} from '../../../core/http';
import {VisionViewerComponent} from '../common/vision-viewer.component';
import {VisionPublicService} from './public.service';
import {Vision} from '../common/vision.model';

/**
 * 培养方案（公共）。
 */
@Component({
    selector: 'public-vision',
    template: require('./item.html'),
    directives: [VisionViewerComponent],
})
export class VisionPublicItemComponent implements OnInit {
    private vm: Vision;
    private id: string;

    constructor(
        public elementRef: ElementRef,
        private publicService: VisionPublicService) {
        // TODO: see https://github.com/angular/angular/issues/1858
        this.id = elementRef.nativeElement.getAttribute('id');
    }

    ngOnInit() {
        this.publicService.getItem(this.id).subscribe(vision => {
            this.vm = vision;
        });
    }
}

bootstrap(VisionPublicItemComponent, [
    provide(API_URL, {useValue: '/api/visions'}),
    REST_PROVIDERS,
    VisionPublicService,
]);