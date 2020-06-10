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
}) => {
    const now = new Date().getTime();
    const datepicker = (
        <p>
            <Select name="expiration" label="Expires After" className="mll">
                <option value="-1">Never</option>
                <option value={new Date(now + 60 * 60 * 1000)}>1 hour</option>
                <option value={new Date(now + 60 * 60 * 1000 * 24 * 1)}>1 day</option>
                <option value={new Date(now + 60 * 60 * 1000 * 24 * 7)}>1 week</option>
                <option value={new Date(now + 60 * 60 * 1000 * 24 * 30)}>30 days</option>
            </Select>
            <Select name="expiration-uses" label="Max Number of Uses" className="mll">
                <option>Unlimited</option>
                <option>1</option>
                <option>2</option>
                <option>5</option>
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
                <option>1000</option>
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
};
export default ExpirationSection;
