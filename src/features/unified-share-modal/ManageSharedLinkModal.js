// @flow
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import { Modal, ModalActions } from '../../components/modal';
import Button from '../../components/button';
import PlainButton from '../../components/plain-button';
import ReadableTime from '../../components/time/ReadableTime';
import LoadingIndicator from '../../components/loading-indicator';
import IconCopy from '../../icons/general/IconCopy';
import * as vars from '../../styles/variables';

type Props = {
    cancelButtonProps?: Object,
    isOpen: boolean,
    item: { id: string, type: string },
    modalProps?: Object,
    onRequestClose: Function,
};

function ManageSharedLinkModal(props: Props) {
    const { isOpen, onRequestClose, modalProps, cancelButtonProps, item } = props;
    const [state, dispatch] = React.useReducer(
        (prevState, action) => {
            switch (action.type) {
                case 'links/start': {
                    return { links: [], isLoading: true, error: null };
                }
                case 'links/success': {
                    return { links: action.payload.shareLinksByItem, isLoading: false, error: null };
                }
                case 'links/error': {
                    return { links: [], isLoading: false, error: action.payload.error };
                }
                default: {
                    return prevState;
                }
            }
        },
        { error: null, links: [], isLoading: false },
    );

    const fetchLinks = async () => {
        let json;
        dispatch({ type: 'links/start', payload: {} });
        try {
            const res = await fetch('/app-api/graphql', {
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
                referrerPolicy: 'no-referrer',
                body: JSON.stringify({
                    operationName: null,
                    variables: {},
                    query: `
                        {
                            shareLinksByItem(
                                itemId: "${item.id}",
                                itemType: "${item.type}"
                            ) {
                                shareName
                                createdAt
                                expiration
                                maxUses
                                item {
                                    name
                                }
                                createdBy {
                                    name
                                    publicName
                                }
                            }
                        }
                    `,
                }),
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
            });
            json = await res.json();
        } catch (error) {
            dispatch({ type: 'links/fail', payload: { error } });
        }
        dispatch({ type: 'links/success', payload: json.data });
    };

    React.useEffect(() => {
        fetchLinks();
    }, []); // eslint-disable-line

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
            className="bdl-ManageSharedLinkModal"
            {...modalProps}
        >
            <table className="bdl-Table table">
                <thead>
                    <tr>
                        <th>Created By</th>
                        <th>Shared Link ID</th>
                        <th />
                        <th>Expiration</th>
                        <th>Uses</th>
                        <th />
                    </tr>
                </thead>
                <tbody>
                    {state.links &&
                        state.links.map(link => {
                            const usesCount = Math.ceil(Math.random() * (link.maxUses || 1));
                            return (
                                <tr key={link.id}>
                                    <td>
                                        {link.createdBy.publicName}
                                        <br />
                                        <small>
                                            <ReadableTime timestamp={new Date(link.createdAt).getTime()} />
                                        </small>
                                    </td>
                                    <td
                                        style={{
                                            maxWidth: 100,
                                            fontFamily: 'monospace',
                                            overflowX: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {link.shareName}
                                    </td>
                                    <td>
                                        <PlainButton>
                                            <IconCopy />
                                        </PlainButton>
                                    </td>
                                    <td>
                                        {link.expiration ? (
                                            <ReadableTime timestamp={new Date(link.expiration).getTime()} />
                                        ) : (
                                            'Never'
                                        )}
                                    </td>
                                    <td>{link.maxUses ? `${usesCount}/${link.maxUses}` : `${usesCount}`}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <PlainButton className="bdl-sharedLink-revoke">
                                            <span style={{ color: vars.bdlWatermelonRed }}>Revoke</span>
                                        </PlainButton>
                                    </td>
                                </tr>
                            );
                        })}
                </tbody>
            </table>
            {state.isLoading ? (
                <p style={{ textAlign: 'center', marginTop: 16, marginBottom: 12 }}>
                    <LoadingIndicator />
                </p>
            ) : null}
            <ModalActions>
                <Button onClick={onRequestClose}>
                    <FormattedMessage
                        id="be.unifiedshare.sharedlink.new"
                        defaultMessage="Generate New Link"
                        description="shared link management - creation button"
                    />
                </Button>
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
