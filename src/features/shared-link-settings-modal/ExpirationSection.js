import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Checkbox from '../../components/checkbox';
import DatePicker from '../../components/date-picker';
import Fieldset from '../../components/fieldset';
import Select from '../../components/select';

import messages from './messages';

const displayFormat = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
};

const ExpirationSection = ({
    canChangeExpiration,
    error,
    expirationCheckboxProps = {},
    expirationDate,
    expirationInputProps = {},
    isExpirationEnabled,
    onCheckboxChange,
    onExpirationDateChange,
    onMaxUsesChange,
}) => {
    const now = new Date().getTime();
    const datepicker = (
        <p>
            <Select
                name="expiration"
                label="Expires After"
                className="mll mrl"
                onChange={event => {
                    if (event.target && event.target.value && event.target.value !== '-1') {
                        onExpirationDateChange(new Date(parseInt(event.target.value, 10)));
                    } else {
                        onExpirationDateChange(null);
                    }
                }}
            >
                <option value="-1">Never</option>
                <option value={new Date(now + 60 * 60 * 1000).getTime()}>1 hour</option>
                <option value={new Date(now + 60 * 60 * 1000 * 24 * 1).getTime()}>1 day</option>
                <option value={new Date(now + 60 * 60 * 1000 * 24 * 7).getTime()}>1 week</option>
                <option value={new Date(now + 60 * 60 * 1000 * 24 * 30).getTime()}>30 days</option>
            </Select>
            <Select name="expiration-uses" label="Max Number of Uses" className="mll mrl" onChange={onMaxUsesChange}>
                <option value="0">Unlimited</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="1000">1000</option>
            </Select>
        </p>
    );
    return (
        <div>
            <hr />
            <Fieldset className="expiration-section" title={<FormattedMessage {...messages.expirationTitle} />}>
                <Checkbox
                    isChecked={isExpirationEnabled}
                    isDisabled={!canChangeExpiration}
                    label={<FormattedMessage {...messages.expirationLabel} />}
                    name="isExpirationEnabled"
                    onChange={onCheckboxChange}
                    subsection={isExpirationEnabled ? datepicker : undefined}
                    {...expirationCheckboxProps}
                />
            </Fieldset>
        </div>
    );
};

ExpirationSection.propTypes = {
    canChangeExpiration: PropTypes.bool.isRequired,
    error: PropTypes.string,
    expirationCheckboxProps: PropTypes.object,
    expirationDate: PropTypes.instanceOf(Date),
    expirationInputProps: PropTypes.object,
    isExpirationEnabled: PropTypes.bool.isRequired,
    onCheckboxChange: PropTypes.func.isRequired,
    onExpirationDateChange: PropTypes.func.isRequired,
    onMaxUsesChange: PropTypes.func.isRequired,
};
export default ExpirationSection;
