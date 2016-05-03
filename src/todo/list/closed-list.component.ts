import {Component, Inject} from '@angular/core';
import {Observable} from 'rxjs/Observable';

import {BASE_URL} from '../../core/http';
import {FromNowComponent} from '../../core/components';
import {TodoService} from '../todo.service';

@Component({
    selector: 'closed-todo-list',
    template: require('./closed-list.html'),
    directives: [FromNowComponent],
})
export class ClosedTodoListComponent {
    todos: Observable<any[]>;

    constructor(@Inject(BASE_URL) private baseUrl: string,  private todoService: TodoService) {
        this.todos = this.todoService.loadList({is: 'closed'});
    }
}
