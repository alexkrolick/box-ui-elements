/**
 * @flow
 * @file Helper for the box Task Assignments API
 * @author Box
 */
import omit from 'lodash/omit';

// The task collab API uses marker-based pagination
// instead of the Base API, use this:
import MarkerAPI from './MarkerBasedAPI';
import {
    ERROR_CODE_FETCH_TASK_COLLABORATOR,
    ERROR_CODE_CREATE_TASK_COLLABORATOR,
    ERROR_CODE_UPDATE_TASK_COLLABORATOR,
    ERROR_CODE_DELETE_TASK_COLLABORATOR,
} from '../constants';

class TaskCollaborators extends MarkerAPI {
    getUrlForTaskCollaborators(taskId: string): string {
        return `${this.getBaseApiUrl()}/undoc/tasks/${taskId}/task_collaborators`;
    }

    getUrlForTaskCollaboratorCreate(): string {
        return `${this.getBaseApiUrl()}/undoc/task_collaborators`;
    }

    getUrlForTaskCollaborator(id: string): string {
        return `${this.getBaseApiUrl()}/undoc/task_collaborators/${id}`;
    }

    createTaskCollaborator({
        errorCallback,
        file,
        successCallback,
        task,
        user,
    }: {
        errorCallback: ElementsErrorCallback,
        file: BoxItem,
        successCallback: Function,
        task: { id: string },
        user: { id: string },
    }): void {
        this.errorCode = ERROR_CODE_CREATE_TASK_COLLABORATOR;

        const requestData = {
            data: {
                task: {
                    type: 'task',
                    id: task.id,
                },
                target: {
                    type: 'user',
                    id: user.id,
                },
            },
        };

        this.post({
            id: file.id,
            url: this.getUrlForTaskCollaboratorCreate(),
            data: { ...requestData },
            successCallback,
            errorCallback,
        });
    }

    getTaskCollaborators({
        errorCallback,
        file,
        successCallback,
        task,
        limit,
        marker,
    }: {
        errorCallback: ElementsErrorCallback,
        file: { id: string },
        limit?: number,
        marker?: string,
        successCallback: Function,
        task: { id: string },
    }): void {
        this.errorCode = ERROR_CODE_FETCH_TASK_COLLABORATOR;
        const url = this.getUrlForTaskCollaborators(task.id);
        // Single-Page GET with default pagination params
        // this.get({ id: file.id, successCallback, errorCallback, url });

        // Paginated GET
        const shouldFetchAll = true;
        this.markerGet({ id: file.id, successCallback, errorCallback, url, limit, marker, shouldFetchAll });
    }

    updateTaskCollaborator({
        errorCallback,
        file,
        successCallback,
        taskCollaborator,
    }: {
        errorCallback: ElementsErrorCallback,
        file: BoxItem,
        successCallback: Function,
        taskCollaborator: { id: string },
    }): void {
        this.errorCode = ERROR_CODE_UPDATE_TASK_COLLABORATOR;

        const requestData = {
            data: omit(taskCollaborator, 'id'),
        };

        this.put({
            id: file.id,
            url: this.getUrlForTaskCollaborator(taskCollaborator.id),
            data: { ...requestData },
            successCallback,
            errorCallback,
        });
    }

    deleteTaskCollaborator({
        errorCallback,
        file,
        successCallback,
        taskCollaborator,
    }: {
        errorCallback: ElementsErrorCallback,
        file: BoxItem,
        successCallback: Function,
        taskCollaborator: { id: string },
    }): void {
        this.errorCode = ERROR_CODE_DELETE_TASK_COLLABORATOR;

        this.delete({
            id: file.id,
            url: this.getUrlForTaskCollaborator(taskCollaborator.id),
            successCallback,
            errorCallback,
        });
    }
}

export default TaskCollaborators;
