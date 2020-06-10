// @flow

import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import PlainButton from '../../components/plain-button';
import Button from '../../components/button';
import TextInputWithCopyButton from '../../components/text-input-with-copy-button';
import Toggle from '../../components/toggle/Toggle';
import Tooltip from '../../components/tooltip';
import { convertToMs } from '../../utils/datetime';
import IconMail from '../../icons/general/IconMail';
import IconClock from '../../icons/general/IconClock';
import IconGlobe from '../../icons/general/IconGlobe';
import { bdlWatermelonRed } from '../../styles/variables';
import type { ItemType } from '../../common/types/core';
import { isBoxNote } from '../../utils/file';
import Browser from '../../utils/Browser';
import LoadingIndicatorWrapper from '../../components/loading-indicator/LoadingIndicatorWrapper';

import convertToBoxItem from './utils/item';
import SharedLinkAccessMenu from './SharedLinkAccessMenu';
import SharedLinkPermissionMenu from './SharedLinkPermissionMenu';
import messages from './messages';
import type {
    accessLevelType,
    item as itemtype,
    permissionLevelType,
    sharedLinkType,
    sharedLinkTrackingType,
    tooltipComponentIdentifierType,
} from './flowTypes';
import { PEOPLE_IN_ITEM, ANYONE_WITH_LINK, CAN_VIEW_DOWNLOAD, CAN_VIEW_ONLY } from './constants';

type Props = {
    addSharedLink: () => void,
    autoCreateSharedLink?: boolean,
    autofocusSharedLink?: boolean,
    changeSharedLinkAccessLevel: (newAccessLevel: accessLevelType) => Promise<{ accessLevel: accessLevelType }>,
    changeSharedLinkPermissionLevel: (
        newPermissionLevel: permissionLevelType,
    ) => Promise<{ permissionLevel: permissionLevelType }>,
    intl: any,
    item: itemtype,
    itemType: ItemType,
    onCopyError?: () => void,
    onCopyInit?: () => void,
    onCopySuccess?: () => void,
    onDismissTooltip: (componentIdentifier: tooltipComponentIdentifierType) => void,
    onEmailSharedLinkClick: Function,
    onManageClick?: Function,
    onSettingsClick?: Function,
    onToggleSharedLink: Function,
    sharedLink: sharedLinkType,
    showSharedLinkSettingsCallout: boolean,
    submitting: boolean,
    tooltips: { [componentIdentifier: tooltipComponentIdentifierType]: React.Node },
    trackingProps: sharedLinkTrackingType,
    triggerCopyOnLoad?: boolean,
};

type State = {
    hasFetchedSharedLinkFromGraphQL: boolean,
    isAutoCreatingSharedLink: boolean,
    isCopySuccessful: ?boolean,
    overrideShareLink: ?string,
};

class SharedLinkSection extends React.Component<Props, State> {
    static defaultProps = {
        trackingProps: {},
        autoCreateSharedLink: false,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            isAutoCreatingSharedLink: false,
            hasFetchedSharedLinkFromGraphQL: false,
            isCopySuccessful: null,
            overrideShareLink: null,
        };
    }

    componentDidMount() {
        const { item, sharedLink, autoCreateSharedLink, addSharedLink, submitting } = this.props;

        if (
            autoCreateSharedLink &&
            !this.state.isAutoCreatingSharedLink &&
            sharedLink &&
            !sharedLink.url &&
            !submitting &&
            !sharedLink.isNewSharedLink
        ) {
            this.setState({ isAutoCreatingSharedLink: true });
            addSharedLink();
        }

        // Call into GraphQL to get/create link
        if (!this.state.hasFetchedSharedLinkFromGraphQL) {
            this.setState({ hasFetchedSharedLinkFromGraphQL: true });

            // Async fetch shared link
            fetch('/app-api/graphql', {
                headers: {
                    accept: '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                },
                referrerPolicy: 'no-referrer',
                body: `{"operationName":null,"variables":{},"query":"{\\n  shareLinkPrimaryByItem(itemId: \\"${item.id}\\", itemType: \\"${item.type}\\") {\\n    shareName\\n    createdAt\\n    item {\\n      name\\n    }\\n    createdBy {\\n      name\\n    }\\n  }\\n}\\n"}`,
                method: 'POST',
                mode: 'cors',
                credentials: 'include',
            }).then(async result => {
                const results = await result.json();

                if (results && results.data && results.data.shareLinkPrimaryByItem) {
                    this.setState({ overrideShareLink: results.data.shareLinkPrimaryByItem.shareName });
                    return;
                }

                // Fire and forget
                fetch('/app-api/graphql', {
                    headers: {
                        accept: '*/*',
                        'accept-language': 'en-US,en;q=0.9',
                        'content-type': 'application/json',
                    },
                    referrerPolicy: 'no-referrer',
                    body: `{"operationName":null,"variables":{},"query":"mutation {\\n  createShareLink(input: {itemId: \\"${item.id}\\", itemType: \\"${item.type}\\"}) {\\n    id\\n    shareName\\n    createdAt\\n    item {\\n      name\\n    }\\n    createdBy {\\n      name\\n    }\\n  }\\n}\\n"}`,
                    method: 'POST',
                    mode: 'cors',
                    credentials: 'include',
                }).then(async result2 => {
                    const shareData = await result2.json();

                    if (shareData && shareData.data && shareData.data.createShareLink) {
                        this.setState({ overrideShareLink: shareData.data.createShareLink.shareName });
                    }
                });
            });
        }
    }

    // We handle didUpdate but not didMount because
    // the component initially renders with empty data
    // in order to start showing UI components.
    // When getInitialData completes in the parent we
    // rerender with correct sharedLink data and can
    // check whether to auto create a new one.
    // Note: we are assuming the 2nd render is safe
    // to start doing this check.
    componentDidUpdate(prevProps: Props) {
        const {
            sharedLink,
            autoCreateSharedLink,
            addSharedLink,
            submitting,
            triggerCopyOnLoad,
            onCopyError = () => {},
            onCopySuccess = () => {},
            onCopyInit = () => {},
        } = this.props;

        const { isAutoCreatingSharedLink, isCopySuccessful } = this.state;

        if (
            autoCreateSharedLink &&
            !isAutoCreatingSharedLink &&
            !sharedLink.url &&
            !submitting &&
            !sharedLink.isNewSharedLink
        ) {
            this.setState({ isAutoCreatingSharedLink: true });
            addSharedLink();
        }

        if (!prevProps.sharedLink.url && sharedLink.url) {
            this.setState({ isAutoCreatingSharedLink: false });
        }

        if (
            Browser.canWriteToClipboard() &&
            triggerCopyOnLoad &&
            !isAutoCreatingSharedLink &&
            sharedLink.url &&
            isCopySuccessful === null
        ) {
            onCopyInit();
            navigator.clipboard
                .writeText(sharedLink.url)
                .then(() => {
                    this.setState({ isCopySuccessful: true });
                    onCopySuccess();
                })
                .catch(() => {
                    this.setState({ isCopySuccessful: false });
                    onCopyError();
                });
        }
    }

    canAddSharedLink = (isSharedLinkEnabled: boolean, canAddLink: boolean) => {
        return !isSharedLinkEnabled && canAddLink;
    };

    canRemoveSharedLink = (isSharedLinkEnabled: boolean, canRemoveLink: boolean) => {
        return isSharedLinkEnabled && canRemoveLink;
    };

    renderSharedLink() {
        const {
            autofocusSharedLink,
            changeSharedLinkAccessLevel,
            changeSharedLinkPermissionLevel,
            item,
            itemType,
            intl,
            onDismissTooltip,
            onEmailSharedLinkClick,
            sharedLink,
            submitting,
            trackingProps,
            triggerCopyOnLoad,
            tooltips,
        } = this.props;

        const { isCopySuccessful, overrideShareLink } = this.state;

        const {
            accessLevel,
            accessLevelsDisabledReason,
            allowedAccessLevels,
            canChangeAccessLevel,
            enterpriseName,
            isEditAllowed,
            isDownloadSettingAvailable,
            permissionLevel,
            url,
        } = sharedLink;

        let shareUrl = url;

        if (overrideShareLink) {
            shareUrl = shareUrl.replace(/[^\/]+$/, overrideShareLink);
            shareUrl = shareUrl.replace(/^.+\.net\//, 'https://box.com/');
        } else {
            // null this out until it returns from graphql
            shareUrl = '';
        }

        const {
            copyButtonProps,
            onChangeSharedLinkAccessLevel,
            onChangeSharedLinkPermissionLevel,
            onSharedLinkAccessMenuOpen,
            onSharedLinkCopy,
            sendSharedLinkButtonProps,
            sharedLinkAccessMenuButtonProps,
            sharedLinkPermissionsMenuButtonProps,
        } = trackingProps;

        const shouldTriggerCopyOnLoad = !!triggerCopyOnLoad && !!isCopySuccessful;

        const isEditableBoxNote = isBoxNote(convertToBoxItem(item)) && isEditAllowed;
        let allowedPermissionLevels = [CAN_VIEW_DOWNLOAD, CAN_VIEW_ONLY];

        if (!canChangeAccessLevel) {
            // remove all but current level
            allowedPermissionLevels = allowedPermissionLevels.filter(level => level === permissionLevel);
        }

        // if we cannot set the download value, we remove this option from the dropdown
        if (!isDownloadSettingAvailable) {
            allowedPermissionLevels = allowedPermissionLevels.filter(level => level !== CAN_VIEW_DOWNLOAD);
        }

        // let description = null;

        // if (description) {
        //     description = <FormattedMessage {...messages.sharedLinkPubliclyAvailable} />;
        // }

        return (
            <>
                <div className="shared-link-field-row">
                    <Tooltip
                        className="usm-ftux-tooltip"
                        isShown={!!tooltips['shared-link-copy-button']}
                        onDismiss={() => onDismissTooltip('shared-link-copy-button')}
                        position="middle-right"
                        showCloseButton
                        text={tooltips['shared-link-copy-button']}
                        theme="callout"
                    >
                        <TextInputWithCopyButton
                            aria-label={intl.formatMessage(messages.sharedLinkURLLabel)}
                            autofocus={autofocusSharedLink}
                            buttonProps={copyButtonProps}
                            className="shared-link-field-container"
                            disabled={submitting}
                            label=""
                            onCopySuccess={onSharedLinkCopy}
                            triggerCopyOnLoad={shouldTriggerCopyOnLoad}
                            type="url"
                            value={shareUrl}
                        />
                    </Tooltip>
                    <Tooltip position="top-left" text={<FormattedMessage {...messages.sendSharedLink} />}>
                        <Button
                            className="email-shared-link-btn"
                            isDisabled={submitting}
                            onClick={onEmailSharedLinkClick}
                            type="button"
                            {...sendSharedLinkButtonProps}
                        >
                            <IconMail />
                        </Button>
                    </Tooltip>
                </div>

                {/* <div className="shared-link-access-row">
                    <SharedLinkAccessMenu
                        accessLevel={accessLevel}
                        accessLevelsDisabledReason={accessLevelsDisabledReason}
                        allowedAccessLevels={allowedAccessLevels}
                        changeAccessLevel={changeSharedLinkAccessLevel}
                        enterpriseName={enterpriseName}
                        itemType={itemType}
                        onDismissTooltip={() => onDismissTooltip('shared-link-access-menu')}
                        tooltipContent={tooltips['shared-link-access-menu'] || null}
                        submitting={submitting}
                        trackingProps={{
                            onChangeSharedLinkAccessLevel,
                            onSharedLinkAccessMenuOpen,
                            sharedLinkAccessMenuButtonProps,
                        }}
                    />
                    {!isEditableBoxNote && accessLevel !== PEOPLE_IN_ITEM && (
                        <SharedLinkPermissionMenu
                            allowedPermissionLevels={allowedPermissionLevels}
                            canChangePermissionLevel={canChangeAccessLevel}
                            changePermissionLevel={changeSharedLinkPermissionLevel}
                            permissionLevel={permissionLevel}
                            submitting={submitting}
                            trackingProps={{
                                onChangeSharedLinkPermissionLevel,
                                sharedLinkPermissionsMenuButtonProps,
                            }}
                        />
                    )}
                    {isEditableBoxNote && (
                        <Tooltip text={<FormattedMessage {...messages.sharedLinkPermissionsEditTooltip} />}>
                            <PlainButton isDisabled className="can-edit-btn">
                                <FormattedMessage {...messages.sharedLinkPermissionsEdit} />
                            </PlainButton>
                        </Tooltip>
                    )}
                </div> */}
                {accessLevel === ANYONE_WITH_LINK && (
                    <div className="security-indicator-note">
                        <span className="security-indicator-icon-globe">
                            <IconGlobe height={12} width={12} />
                        </span>
                        <FormattedMessage {...messages.sharedLinkPubliclyAvailable} />
                    </div>
                )}
            </>
        );
    }

    renderSharedLinkSettingsLink() {
        const {
            intl,
            onDismissTooltip,
            onSettingsClick,
            onManageClick,
            showSharedLinkSettingsCallout,
            trackingProps,
            tooltips,
        } = this.props;
        const { sharedLinkSettingsButtonProps } = trackingProps;

        return (
            <div className="shared-link-settings-btn-container">
                <PlainButton
                    aria-label={intl.formatMessage(messages.sharedLinkManageLabel)}
                    className="shared-manage-btn"
                    onClick={onManageClick}
                    type="button"
                >
                    <FormattedMessage {...messages.sharedLinkManage} />
                </PlainButton>
                &nbsp;|&nbsp;
                <Tooltip
                    className="usm-ftux-tooltip"
                    isShown={!!tooltips['shared-link-settings'] || showSharedLinkSettingsCallout}
                    onDismiss={() => onDismissTooltip('shared-link-settings')}
                    position="middle-right"
                    showCloseButton
                    text={
                        tooltips['shared-link-settings'] || (
                            <FormattedMessage {...messages.sharedLinkSettingsCalloutText} />
                        )
                    }
                    theme="callout"
                >
                    <PlainButton
                        {...sharedLinkSettingsButtonProps}
                        aria-label={intl.formatMessage(messages.settingsButtonLabel)}
                        className="shared-link-settings-btn"
                        onClick={onSettingsClick}
                        type="button"
                    >
                        <FormattedMessage {...messages.sharedLinkSettings} />
                    </PlainButton>
                </Tooltip>
            </div>
        );
    }

    renderToggle() {
        const { item, onDismissTooltip, onToggleSharedLink, sharedLink, submitting, tooltips } = this.props;
        const { canChangeAccessLevel, expirationTimestamp, url } = sharedLink;
        const isSharedLinkEnabled = !!url;
        const canAddSharedLink = this.canAddSharedLink(isSharedLinkEnabled, item.grantedPermissions.itemShare);
        const canRemoveSharedLink = this.canRemoveSharedLink(isSharedLinkEnabled, canChangeAccessLevel);
        const isToggleEnabled = (canAddSharedLink || canRemoveSharedLink) && !submitting;

        let linkText;

        if (isSharedLinkEnabled) {
            linkText = <FormattedMessage {...messages.linkShareOn} />;
            if (expirationTimestamp && expirationTimestamp !== 0) {
                linkText = (
                    <span>
                        <FormattedMessage {...messages.linkShareOn} />
                        <Tooltip
                            position="top-center"
                            text={
                                <FormattedMessage
                                    {...messages.sharedLinkExpirationTooltip}
                                    values={{
                                        expiration: convertToMs(expirationTimestamp),
                                    }}
                                />
                            }
                        >
                            <span className="shared-link-expiration-badge">
                                <IconClock color={bdlWatermelonRed} />
                            </span>
                        </Tooltip>
                    </span>
                );
            }
        } else {
            linkText = <FormattedMessage {...messages.linkShareOff} />;
        }

        const toggleComponent = (
            <div className="share-toggle-container">
                <Toggle
                    isDisabled={!isToggleEnabled}
                    isOn={isSharedLinkEnabled}
                    label={linkText}
                    name="toggle"
                    onChange={onToggleSharedLink}
                />
            </div>
        );

        if (!submitting) {
            if (canAddSharedLink) {
                const sharedLinkToggleTooltip = tooltips['shared-link-toggle'];
                if (sharedLinkToggleTooltip) {
                    return (
                        <Tooltip
                            className="usm-ftux-tooltip"
                            isShown
                            onDismiss={() => onDismissTooltip('shared-link-toggle')}
                            position="middle-left"
                            showCloseButton
                            text={sharedLinkToggleTooltip}
                            theme="callout"
                        >
                            {toggleComponent}
                        </Tooltip>
                    );
                }
                return (
                    <Tooltip
                        position="top-right"
                        text={<FormattedMessage {...messages.sharedLinkDisabledTooltipCopy} />}
                    >
                        {toggleComponent}
                    </Tooltip>
                );
            }

            if (!isToggleEnabled) {
                const tooltipDisabledMessage = isSharedLinkEnabled
                    ? messages.removeLinkTooltip
                    : messages.disabledCreateLinkTooltip;

                return (
                    <Tooltip
                        className="usm-disabled-message-tooltip"
                        position="top-right"
                        text={<FormattedMessage {...tooltipDisabledMessage} />}
                    >
                        {toggleComponent}
                    </Tooltip>
                );
            }
        }

        return toggleComponent;
    }

    render() {
        const { sharedLink, onSettingsClick } = this.props;
        const isSharedLinkEnabled = !!sharedLink.url;

        return (
            <div>
                <hr className="bdl-SharedLinkSection-separator" />
                <div className="shared-link-toggle-row">
                    {/* eslint-disable-next-line jsx-a11y/label-has-for */}
                    <label className="bdl-SharedLinkSection-label">
                        <span className="label bdl-Label">
                            <FormattedMessage {...messages.sharedLinkSectionLabel} />
                        </span>
                    </label>
                    {/* {this.renderToggle()} */}
                    {isSharedLinkEnabled && onSettingsClick && this.renderSharedLinkSettingsLink()}
                </div>
                <LoadingIndicatorWrapper isLoading={!this.state.overrideShareLink} hideContent>
                    {isSharedLinkEnabled && this.renderSharedLink()}
                </LoadingIndicatorWrapper>
            </div>
        );
    }
}

export default SharedLinkSection;
