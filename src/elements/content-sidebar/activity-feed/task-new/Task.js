// @flow
import * as React from 'react';
import noop from 'lodash/noop';
import flow from 'lodash/flow';
import get from 'lodash/get';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import TetherComponent from 'react-tether';
import { withFeatureConsumer, getFeatureConfig } from '../../../common/feature-checking';
import { withAPIContext } from '../../../common/api-context';
import Avatar from '../Avatar';
import Media from '../../../../components/media';
import { MenuItem } from '../../../../components/menu';
import ActivityError from '../common/activity-error';
import ActivityMessage from '../common/activity-message';
import ActivityTimestamp from '../common/activity-timestamp';
import DeleteConfirmation from '../common/delete-confirmation';
import IconTaskApproval from '../../../../icons/two-toned/IconTaskApproval';
import IconTaskGeneral from '../../../../icons/two-toned/IconTaskGeneral';
import IconTrash from '../../../../icons/general/IconTrash';
import IconPencil from '../../../../icons/general/IconPencil';
import UserLink from '../common/user-link';
import API from '../../../../api/APIFactory';
import {
    TASK_COMPLETION_RULE_ALL,
    TASK_NEW_APPROVED,
    TASK_NEW_REJECTED,
    TASK_NEW_NOT_STARTED,
    TASK_NEW_IN_PROGRESS,
    TASK_NEW_COMPLETED,
    TASK_TYPE_APPROVAL,
    PLACEHOLDER_USER,
    TASK_EDIT_MODE_EDIT,
} from '../../../../constants';
import type { TaskAssigneeCollection, TaskNew, TaskType } from '../../../../common/types/tasks';
import { ACTIVITY_TARGETS } from '../../../common/interactionTargets';
import { bdlGray80 } from '../../../../styles/variables';
import TaskActions from './TaskActions';
import TaskDueDate from './TaskDueDate';
import TaskStatus from './TaskStatus';
import AssigneeList from './AssigneeList';
import TaskModal from '../../TaskModal';
import commonMessages from '../../../common/messages';
import messages from './messages';

import './Task.scss';

type Props = {|
    ...TaskNew,
    api: API,
    approverSelectorContacts: SelectorItems,
    currentUser: User,
    error?: ActionItemError,
    features?: FeatureConfig,
    getApproverWithQuery?: Function,
    getAvatarUrl: GetAvatarUrlCallback,
    getMentionWithQuery?: Function,
    getUserProfileUrl?: GetProfileUrlCallback,
    isPending?: boolean,
    onAssignmentUpdate: Function,
    onDelete?: Function,
    onEdit?: Function,
    onModalClose?: Function,
    translatedTaggedMessage?: string,
    translations?: Translations,
|};

type State = {
    // the complete list of assignees (when task.assigned_to is truncated)
    assignedToFull: TaskAssigneeCollection,
    isAssigneeListOpen: boolean,
    isConfirmingDelete: boolean,
    isEditing: boolean,
    isLoading: boolean,
    loadCollabError: ?ActionItemError,
    modalError: ?ElementsXhrError,
};

const getMessageForTask = (isCurrentUser: boolean, taskType: TaskType) => {
    if (isCurrentUser) {
        if (taskType === TASK_TYPE_APPROVAL) {
            return messages.tasksFeedHeadlineApprovalCurrentUser;
        }
        return messages.tasksFeedHeadlineGeneralCurrentUser;
    }

    if (taskType === TASK_TYPE_APPROVAL) {
        return messages.tasksFeedHeadlineApproval;
    }
    return messages.tasksFeedHeadlineGeneral;
};

class Task extends React.Component<Props, State> {
    static defaultProps = {
        completion_rule: TASK_COMPLETION_RULE_ALL,
    };

    state = {
        loadCollabError: undefined,
        assignedToFull: this.props.assigned_to,
        modalError: undefined,
        isEditing: false,
        isLoading: false,
        isAssigneeListOpen: false,
        isConfirmingDelete: false,
    };

    handleAssigneeListExpand = () => {
        this.getAllTaskCollaborators(() => {
            this.setState({ isAssigneeListOpen: true });
        });
    };

    handleAssigneeListCollapse = () => {
        this.setState({ isAssigneeListOpen: false });
    };

    handleEditClick = () => {
        this.getAllTaskCollaborators(() => {
            this.setState({ isEditing: true });
        });
    };

    handleDeleteClick = () => {
        this.setState({ isConfirmingDelete: true });
    };

    handleDeleteConfirm = (): void => {
        const { id, onDelete, permissions } = this.props;

        if (onDelete) {
            onDelete({ id, permissions });
        }
    };

    handleDeleteCancel = (): void => {
        this.setState({ isConfirmingDelete: false });
    };

    handleEditModalClose = () => {
        const { onModalClose } = this.props;
        this.setState({ isEditing: false, modalError: undefined });

        if (onModalClose) {
            onModalClose();
        }
    };

    handleEditSubmitSuccess = () => {
        this.setState({ isEditing: false });
        const { onModalClose } = this.props;

        if (onModalClose) {
            onModalClose();
        }
    };

    handleEditSubmitError = (error: ElementsXhrError) => {
        this.setState({ modalError: error });
    };

    getAllTaskCollaborators = (onSuccess: () => any) => {
        const { id, api, task_links, assigned_to } = this.props;
        const { errorOccured } = commonMessages;
        const { taskCollaboratorLoadErrorMessage } = messages;

        // skip fetch when there are no additional collaborators
        if (!assigned_to.next_marker) {
            this.setState({ assignedToFull: assigned_to });
            onSuccess();
            return;
        }

        // fileid is required for api calls, check for presence
        const fileId = get(task_links, 'entries[0].target.id');
        if (!fileId) {
            return;
        }

        this.setState({ isLoading: true });
        api.getTaskCollaboratorsAPI(false).getTaskCollaborators({
            task: { id },
            file: { id: fileId },
            errorCallback: () => {
                this.setState({
                    isLoading: false,
                    loadCollabError: {
                        message: taskCollaboratorLoadErrorMessage,
                        title: errorOccured,
                    },
                });
            },
            successCallback: assignedToFull => {
                this.setState({ assignedToFull, isLoading: false });
                onSuccess();
            },
        });
    };

    handleTaskAction = (taskId: string, assignmentId: string, taskStatus: string) => {
        const { onAssignmentUpdate } = this.props;

        this.setState({ isAssigneeListOpen: false });

        onAssignmentUpdate(taskId, assignmentId, taskStatus);
    };

    render() {
        const {
            approverSelectorContacts,
            assigned_to,
            completion_rule,
            created_at,
            created_by,
            currentUser,
            due_at,
            error,
            features,
            getApproverWithQuery,
            getAvatarUrl,
            getUserProfileUrl,
            id,
            isPending,
            description,
            onEdit,
            permissions,
            status,
            task_type,
            translatedTaggedMessage,
            translations,
        } = this.props;

        const {
            assignedToFull,
            modalError,
            isEditing,
            isLoading,
            loadCollabError,
            isAssigneeListOpen,
            isConfirmingDelete,
        } = this.state;

        const inlineError = loadCollabError || error;

        const currentUserAssignment =
            assigned_to && assigned_to.entries
                ? assigned_to.entries.find(({ target }) => target.id === currentUser.id)
                : null;

        const createdByUser = created_by.target || PLACEHOLDER_USER;

        const createdAtTimestamp = new Date(created_at).getTime();

        const shouldShowActions =
            currentUserAssignment &&
            currentUserAssignment.permissions &&
            currentUserAssignment.permissions.can_update &&
            currentUserAssignment.status === TASK_NEW_NOT_STARTED &&
            (status === TASK_NEW_NOT_STARTED || status === TASK_NEW_IN_PROGRESS);

        const TaskTypeIcon = task_type === TASK_TYPE_APPROVAL ? IconTaskApproval : IconTaskGeneral;

        const isMenuVisible = (permissions.can_delete || permissions.can_update) && !isPending;

        return (
            <div className="bcs-Task">
                {inlineError ? <ActivityError {...inlineError} /> : null}
                <Media
                    className={classNames('bcs-Task-media', {
                        'bcs-is-pending': isPending || isLoading,
                    })}
                    data-testid="task-card"
                >
                    <Media.Figure className="bcs-Task-avatar">
                        <Avatar getAvatarUrl={getAvatarUrl} user={createdByUser} />
                        <TaskTypeIcon width={20} height={20} className="bcs-Task-avatarBadge" />
                    </Media.Figure>
                    <Media.Body>
                        {isMenuVisible && (
                            <TetherComponent
                                attachment="top right"
                                className="bcs-Task-deleteConfirmationModal"
                                constraints={[{ to: 'scrollParent', attachment: 'together' }]}
                                targetAttachment="bottom right"
                            >
                                <Media.Menu isDisabled={isConfirmingDelete} data-testid="task-actions-menu">
                                    {permissions.can_update && (
                                        <MenuItem
                                            data-resin-target={ACTIVITY_TARGETS.INLINE_EDIT}
                                            data-testid="edit-task"
                                            onClick={this.handleEditClick}
                                        >
                                            <IconPencil color={bdlGray80} />
                                            <FormattedMessage {...messages.taskEditMenuItem} />
                                        </MenuItem>
                                    )}
                                    {permissions.can_delete && (
                                        <MenuItem
                                            data-resin-target={ACTIVITY_TARGETS.INLINE_DELETE}
                                            data-testid="delete-task"
                                            onClick={this.handleDeleteClick}
                                        >
                                            <IconTrash color={bdlGray80} />
                                            <FormattedMessage {...messages.taskDeleteMenuItem} />
                                        </MenuItem>
                                    )}
                                </Media.Menu>
                                {isConfirmingDelete && (
                                    <DeleteConfirmation
                                        isOpen={isConfirmingDelete}
                                        message={messages.taskDeletePrompt}
                                        onDeleteCancel={this.handleDeleteCancel}
                                        onDeleteConfirm={this.handleDeleteConfirm}
                                    />
                                )}
                            </TetherComponent>
                        )}
                        <div>
                            <FormattedMessage
                                {...getMessageForTask(!!currentUserAssignment, task_type)}
                                values={{
                                    user: (
                                        <UserLink
                                            {...createdByUser}
                                            data-resin-target={ACTIVITY_TARGETS.PROFILE}
                                            getUserProfileUrl={getUserProfileUrl}
                                        />
                                    ),
                                }}
                            />
                        </div>
                        <div>
                            <ActivityTimestamp date={createdAtTimestamp} />
                        </div>
                        <div>
                            <ActivityMessage
                                id={id}
                                tagged_message={description}
                                translatedTaggedMessage={translatedTaggedMessage}
                                {...translations}
                                translationFailed={error ? true : null}
                                getUserProfileUrl={getUserProfileUrl}
                            />
                        </div>
                        <div className="bcs-Task-statusContainer">
                            {!!due_at && <TaskDueDate dueDate={due_at} status={status} />}
                            <TaskStatus status={status} />
                        </div>
                        <div className="bcs-Task-assigneeListContainer">
                            <AssigneeList
                                isOpen={isAssigneeListOpen}
                                onCollapse={this.handleAssigneeListCollapse}
                                onExpand={this.handleAssigneeListExpand}
                                getAvatarUrl={getAvatarUrl}
                                initialAssigneeCount={3}
                                users={isAssigneeListOpen ? assignedToFull : assigned_to}
                            />
                        </div>
                        {currentUserAssignment && shouldShowActions && (
                            <div className="bcs-Task-actionsContainer">
                                <TaskActions
                                    taskType={task_type}
                                    onTaskApproval={
                                        isPending
                                            ? noop
                                            : () => {
                                                  this.handleTaskAction(
                                                      id,
                                                      currentUserAssignment.id,
                                                      TASK_NEW_APPROVED,
                                                  );
                                              }
                                    }
                                    onTaskReject={
                                        isPending
                                            ? noop
                                            : () =>
                                                  this.handleTaskAction(id, currentUserAssignment.id, TASK_NEW_REJECTED)
                                    }
                                    onTaskComplete={
                                        isPending
                                            ? noop
                                            : () =>
                                                  this.handleTaskAction(
                                                      id,
                                                      currentUserAssignment.id,
                                                      TASK_NEW_COMPLETED,
                                                  )
                                    }
                                />
                            </div>
                        )}
                    </Media.Body>
                </Media>
                <TaskModal
                    editMode={TASK_EDIT_MODE_EDIT}
                    error={modalError}
                    feedbackUrl={getFeatureConfig(features, 'activityFeed.tasks').feedbackUrl || ''}
                    onSubmitError={this.handleEditSubmitError}
                    onSubmitSuccess={this.handleEditSubmitSuccess}
                    onModalClose={this.handleEditModalClose}
                    isTaskFormOpen={isEditing}
                    taskFormProps={{
                        id,
                        approvers: assignedToFull.entries,
                        approverSelectorContacts,
                        completionRule: completion_rule,
                        getApproverWithQuery,
                        getAvatarUrl,
                        createTask: () => {},
                        editTask: onEdit,
                        dueDate: due_at,
                        message: description,
                    }}
                    taskType={task_type}
                />
            </div>
        );
    }
}

export { Task as TaskComponent };
export default flow([withFeatureConsumer, withAPIContext])(Task);
