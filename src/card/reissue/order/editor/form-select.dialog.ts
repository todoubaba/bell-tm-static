import {Component, Inject, QueryList, ViewChildren} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import 'rxjs/add/operator/do';

import * as _ from 'lodash';

import {CheckboxSelectorComponent} from 'core/common-directives';
import {BaseDialog} from 'core/dialogs';
import {Rest} from 'core/rest';

@Component({
    templateUrl: 'form-select.dialog.html',
})
export class ReissueFormSelectDialog extends BaseDialog {
    @ViewChildren(CheckboxSelectorComponent) selectors: QueryList<CheckboxSelectorComponent>;

    constructor(
        private rest: Rest,
        @Inject('REISSUES_API_URL')
        private reissuesApiUrl: string,
    ) {
        super();
    }

    checkAll(checked: boolean) {
        this.selectors.forEach(checkbox => checkbox.checked = checked);
    }

    protected onOpening(): Observable<any> {
        return this.rest.get(`${this.reissuesApiUrl}?status=APPROVED`).do((result: any) => {
            // 删除已添加的申请
            result.forms = _.differenceWith(
                result.forms,
                this.options.order.items,
                (form: any, item: any) => form.id === item.formId,
            );
        });
    }

    protected onConfirmed(): any {
        return this.selectors.filter(s => s.checked).map(s => s.data);
    }
}
