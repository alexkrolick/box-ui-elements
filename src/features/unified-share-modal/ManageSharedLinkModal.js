// @flow
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import { Modal, ModalActions } from '../../components/modal';
import Button from '../../components/button';

type Props = {
    cancelButtonProps?: Object,
    isOpen: boolean,
    modalProps?: Object,
    onRequestClose: Function,
};

function ManageSharedLinkModal(props: Props) {
    const { isOpen, onRequestClose, modalProps, cancelButtonProps } = props;

    return (
        <Modal
            focusElementSelector=".btn-primary"
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            title={
                <FormattedMessage
                    id="be.unifiedshare.sharedlink.title"
                    defaultMessage="Shared Links"
                    description="shared link management modal title"
                />
            }
            {...modalProps}
        >
            <p>Manage all the links here</p>
            <ModalActions>
                <Button onClick={onRequestClose} {...cancelButtonProps}>
                    <FormattedMessage
                        id="be.unifiedshare.sharedlink.done"
                        defaultMessage="Done"
                        description="shared link management modal title"
                    />
                </Button>
            </ModalActions>
        </Modal>
    );
}

export default ManageSharedLinkModal;
