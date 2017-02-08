import {Injectable, Inject} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {ApiUrl, Rest, EditService} from 'core/rest';

@Injectable()
export class FreeFormService extends EditService {
    constructor(rest: Rest, api: ApiUrl) {
        super(rest, api);
    }

    finish(id: any): Observable<any> {
        return this.rest.patch(`${this.api.item(id)}?op=FINISH`, {});
    }
}