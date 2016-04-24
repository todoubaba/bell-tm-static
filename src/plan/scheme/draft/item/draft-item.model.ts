/* tslint:disable:no-unused-variable */
import {Scheme} from '../../common/scheme.model';
/* tslint:enable:no-unused-variable */

declare module '../../common/scheme.model' {
    interface Scheme {
        editable?: boolean;
        revisable?: boolean;
    }
}