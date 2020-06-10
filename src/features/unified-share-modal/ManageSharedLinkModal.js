// @flow
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import { Modal, ModalActions } from '../../components/modal';
import Button from '../../components/button';
import PlainButton from '../../components/plain-button';
import PrimaryButton from '../../components/primary-button';
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
                case 'linkRevoke/success': {
                    return {
                        ...prevState,
                        links: prevState.links.map(l => {
                            if (l.id === action.payload.id) {
                                return { ...l, revoked: true };
                            }
                            return l;
                        }),
                    };
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
                                id
                                shareName
                                createdAt
                                expiration
                                maxUses
                                revoked
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

    const revokeLink = async id => {
        let json;
        dispatch({ type: 'linkRevoke/start', payload: {} });
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
                        mutation {
                            revokeShareLink(id: "${id}") {
                                shareName
                                id
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
            dispatch({ type: 'linkRevoke/fail', payload: { error } });
        }
        dispatch({ type: 'linkRevoke/success', payload: { id, ...json.data } });
    };

    React.useEffect(() => {
        fetchLinks();
    }, []); // eslint-disable-line

    let sortedLinks = { activeLinks: [], inactiveLinks: [] };

    if (!state.isLoading && state.links) {
        sortedLinks = state.links
            .map(link => {
                const usesCount = Math.ceil(Math.random() * (link.maxUses || 1));
                return { ...link, usesCount };
            })
            .reduce(
                ({ inactiveLinks, activeLinks }, link) => {
                    const now = new Date();
                    const inactive =
                        ((link.maxUses || 0) >= 1 && link.usesCount >= link.maxUses) ||
                        (link.expiration && new Date(link.expiration) < now) ||
                        !!link.revoked;
                    return {
                        inactiveLinks: [...inactiveLinks, inactive ? link : undefined].filter(Boolean),
                        activeLinks: [...activeLinks, !inactive ? link : undefined].filter(Boolean),
                    };
                },
                { inactiveLinks: [], activeLinks: [] },
            );
    }

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
            <h5>Active Links</h5>
            <table className="bdl-Table table mbl">
                <thead>
                    <tr>
                        <th style={{ width: '150px' }}>Created By</th>
                        <th style={{ minWidth: '150px' }}>Shared Link ID</th>
                        <th style={{ width: '70px' }} />
                        <th style={{ width: '150px' }}>Expiration</th>
                        <th style={{ width: '80px' }}>Uses</th>
                        <th style={{ width: '70px' }} />
                    </tr>
                </thead>
                <tbody>
                    {state.links &&
                        sortedLinks.activeLinks.map((link: any) => {
                            return (
                                <tr className="shared-link-row" key={link.id}>
                                    <td>
                                        {link.createdBy.publicName}
                                        <br />
                                        <small>
                                            <ReadableTime timestamp={new Date(link.createdAt).getTime()} />
                                        </small>
                                    </td>
                                    <td>
                                        <span
                                            style={{
                                                fontFamily: 'monospace',
                                                maxWidth: 80,
                                                display: 'inline-block',
                                                overflowX: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                            title={link.shareName}
                                        >
                                            {link.shareName}
                                        </span>
                                        <br />
                                        <small>People in your company can view</small>
                                    </td>
                                    <td>
                                        <PlainButton className="bdl-sharedLinkTable-copy">
                                            <IconCopy />
                                        </PlainButton>
                                    </td>
                                    <td style={{ minWidth: 100 }}>
                                        {link.expiration ? (
                                            <ReadableTime timestamp={new Date(link.expiration).getTime()} />
                                        ) : (
                                            'Never'
                                        )}
                                    </td>
                                    <td>{link.maxUses ? `${link.usesCount}/${link.maxUses}` : `${link.usesCount}`}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <PlainButton
                                            className="bdl-sharedLink-revoke"
                                            onClick={() => {
                                                revokeLink(link.id);
                                            }}
                                        >
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
            {!state.isLoading && (
                <>
                    <h5 className="mtl">Inactive or Expired Links</h5>
                    <table className="bdl-Table table">
                        <thead>
                            <tr>
                                <th style={{ width: '150px' }}>Created By</th>
                                <th style={{ minWidth: '150px' }}>Shared Link ID</th>
                                <th style={{ width: '70px' }} />
                                <th style={{ width: '150px' }}>Expiration</th>
                                <th style={{ width: '80px' }}>Uses</th>
                                <th style={{ width: '70px' }} />
                            </tr>
                        </thead>
                        <tbody>
                            {state.links &&
                                sortedLinks.inactiveLinks.map(link => {
                                    return (
                                        <tr className="shared-link-row" key={link.id} style={{ opacity: '67%' }}>
                                            <td>
                                                {link.createdBy.publicName}
                                                <br />
                                                <small>
                                                    <ReadableTime timestamp={new Date(link.createdAt).getTime()} />
                                                </small>
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        fontFamily: 'monospace',
                                                        maxWidth: 80,
                                                        display: 'inline-block',
                                                        overflowX: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                    title={link.shareName}
                                                >
                                                    {link.shareName}
                                                </span>
                                                <br />
                                                <small>People in your company can view</small>
                                            </td>
                                            <td>
                                                <PlainButton className="bdl-sharedLinkTable-copy">
                                                    <IconCopy />
                                                </PlainButton>
                                            </td>
                                            <td style={{ minWidth: 100 }}>
                                                {link.expiration ? (
                                                    <ReadableTime timestamp={new Date(link.expiration).getTime()} />
                                                ) : (
                                                    'Never'
                                                )}
                                            </td>
                                            <td>
                                                {link.maxUses
                                                    ? `${link.usesCount}/${link.maxUses}`
                                                    : `${link.usesCount}`}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <PlainButton className="">
                                                    {!!link.revoked && (
                                                        <span style={{ color: vars.bdlWatermelonRed }}>Revoked</span>
                                                    )}
                                                </PlainButton>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </>
            )}
            <ModalActions style={{ justifyContent: 'space-between' }}>
                <Button onClick={onRequestClose}>
                    <FormattedMessage
                        id="be.unifiedshare.sharedlink.new"
                        defaultMessage="Generate New Link"
                        description="shared link management - creation button"
                    />
                </Button>
                <PrimaryButton onClick={onRequestClose} {...cancelButtonProps}>
                    <FormattedMessage
                        id="be.unifiedshare.sharedlink.done"
                        defaultMessage="Done"
                        description="shared link management modal title"
                    />
                </PrimaryButton>
            </ModalActions>
        </Modal>
    );
}

export default ManageSharedLinkModal;
