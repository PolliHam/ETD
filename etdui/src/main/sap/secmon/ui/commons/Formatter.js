jQuery.sap.declare("sap.secmon.ui.commons.Formatter");

/**
 * Make some formatters globally available. Currently only the examples from the Developer Guide are contained.
 */
sap.secmon.ui.commons.Formatter =
        {

            ONE_HOUR_IN_MS : 3600000,

            /**
             * formatting for a timestamp, including date and time.
             */
            dateFormatter : function(val, sDateFormat, sTimeFormat) {
                // on initialization 'val' is null -> show 'not
                // available'
                if (!val) {
                    return "";
                }
                if (!sDateFormat) {
                    sDateFormat = "short";
                }
                if (!sTimeFormat) {
                    sTimeFormat = "long";
                }
                var sDateTime;
                jQuery.sap.require("sap.ui.core.format.DateFormat");
                // In UI5 1.28 the method getDateTimeInstance doesn't accept style mixed
                // like "short/long"
                // Therefore we do it manually
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    style : sDateFormat
                });
                sDateTime = oDateFormat.format(new Date(val)) + " ";
                oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
                    style : sTimeFormat
                });
                sDateTime = sDateTime + oDateFormat.format(new Date(val));
                return sDateTime;
            },

            /**
             * formatting for a timestamp, including date and time.
             */
            dateFormatterEx : function(utc, val, sDateFormat, sTimeFormat) {
                // on initialization 'val' is null -> show 'not
                // available'
                if (!val) {
                    return "";
                }
                if (!sDateFormat) {
                    sDateFormat = "short";
                }
                if (!sTimeFormat) {
                    sTimeFormat = "long";
                }
                var sDateTime;
                jQuery.sap.require("sap.ui.core.format.DateFormat");
                // In UI5 1.28 the method getDateTimeInstance doesn't accept style mixed
                // like "short/long"
                // Therefore we do it manually
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    style : sDateFormat,
                    UTC : utc
                });
                sDateTime = oDateFormat.format(new Date(val)) + " ";
                oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
                    style : sTimeFormat,
                    UTC : utc
                });
                sDateTime = sDateTime + oDateFormat.format(new Date(val));
                return sDateTime.replace("GMTZ", "UTC");
            },

            /**
             * formatting for a Date. The time and timezone info is ignored. The returned value may look like "22/03/2017" or similar, depending on locale
             */
            dateOnlyFormatter : function(utc, val, sDateFormat) {
                // on initialization 'val' is null -> show 'not
                // available'
                if (!val) {
                    return "";
                }
                if (!sDateFormat) {
                    sDateFormat = "short";
                }
                jQuery.sap.require("sap.ui.core.format.DateFormat");
                var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                    style : sDateFormat,
                    UTC : utc
                });
                var sDate = oDateFormat.format(new Date(val)) + " ";
                return sDate;
            },

            timeRangeFormatter : function(sText, oDate1, oDate2) {
                // on initialization 'val' is null -> show 'not
                // available'
                if (!sText || !oDate1 || !oDate2) {
                    return "";
                }
                return sap.secmon.ui.commons.Formatter.i18nText(sText, sap.secmon.ui.commons.Formatter.dateFormatter(oDate1, null, "medium"), sap.secmon.ui.commons.Formatter.dateFormatter(oDate2));
            },

            timeRangeFormatterEx : function(utc, sText, oDate1, oDate2) {
                // on initialization 'val' is null -> show 'not
                // available'
                if (!sText || !oDate1 || !oDate2) {
                    return "";
                }
                return sap.secmon.ui.commons.Formatter.i18nText(sText, sap.secmon.ui.commons.Formatter.dateFormatterEx(utc, oDate1, null, "medium"), sap.secmon.ui.commons.Formatter.dateFormatterEx(
                        utc, oDate2));
            },

            /**
             * return the time part of a timestamp, including time offset. It looks like "10:00:00 pm GMT+02:00", or "10:00:00 pm UTC", respectively.
             * 
             * @param utc
             *            whether to render UTC or local time
             * @param stimeFormat
             *            "short", "medium", or "long"
             */
            timeFormatter : function(utc, val, sTimeFormat) {
                // on initialization 'val' is null -> show 'not
                // available'
                if (!val) {
                    return "";
                }
                if (!sTimeFormat) {
                    sTimeFormat = "long";
                }
                var sTime;
                jQuery.sap.require("sap.ui.core.format.DateFormat");
                var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
                    style : sTimeFormat,
                    UTC : utc
                });
                sTime = oTimeFormat.format(new Date(val));
                return sTime.replace("GMTZ", "UTC");
            },

            /**
             * Return only the (local) time part of a timestamp. The format looks like "10:00:00 pm". Caution: During switch from daylight saving time to normal time, we have a duplicated hour. So we
             * append 'A' or 'B', respectively. It would look like "02:00A AM" and "02:00B AM".
             * 
             * @param utc
             *            boolean value if true, UTC time is rendered.
             * @param timestamp
             *            the tiomestamp to be rendered
             * @param timePattern
             *            optional. If not supplied, we use "hh:mm aaa"
             */
            timeOnlyFormatter : function(utc, timestamp, timePattern) {
                if (!timestamp) {
                    return null;
                }

                // refer to http://userguide.icu-project.org/formatparse/datetime
                var sTimePattern = timePattern || 'hh:mm aaa';

                jQuery.sap.require("sap.ui.core.format.DateFormat");
                var oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
                    pattern : sTimePattern,
                    UTC : utc
                });
                var sTime = oDateFormat.format(new Date(timestamp));

                if (utc !== true) {
                    // take effects of daylight saving into account
                    var sLastHour = oDateFormat.format(new Date(timestamp.getTime() - sap.secmon.ui.commons.Formatter.ONE_HOUR_IN_MS));
                    var sNextHour = oDateFormat.format(new Date(timestamp.getTime() + sap.secmon.ui.commons.Formatter.ONE_HOUR_IN_MS));

                    if (sLastHour === sTime) {
                        if (timePattern) {
                            return sTime + 'B';
                        } else {
                            return sTime.slice(0, 5) + 'B' + sTime.slice(5);
                        }
                    } else if (sNextHour === sTime) {
                        if (timePattern) {
                            return sTime + 'A';
                        } else {
                            return sTime.slice(0, 5) + 'A' + sTime.slice(5);
                        }
                    }
                }

                return sTime;
            },

            /**
             * return the timezone info for a given timestamp (considering daylight saving). It returns something like "GMT+02:00", or "UTC".
             * 
             * @param utc
             *            whether to render UTC
             * @param itimestamp
             *            the reference timestamp
             */
            timezoneInfo : function(utc, oTimestamp) {
                if (utc === true) {
                    return 'UTC';
                }
                // refer to http://userguide.icu-project.org/formatparse/datetime
                var sTimePattern = 'zzzz';

                jQuery.sap.require("sap.ui.core.format.DateFormat");
                var oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
                    pattern : sTimePattern,
                    UTC : false
                });
                var sTimeZone = oDateFormat.format(new Date(oTimestamp));

                return sTimeZone;
            },

            /**
             * return the weekday as string. It does not return timezone info.
             * 
             * @param utc
             *            boolean: whether the UI displays UTC or not
             * @param date
             */
            weekdayFormatter : function(utc, date) {

                // refer to http://userguide.icu-project.org/formatparse/datetime
                var sDayPattern = 'cccc';

                jQuery.sap.require("sap.ui.core.format.DateFormat");
                var oDayFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern : sDayPattern,
                    UTC : utc,
                    style : "long"
                });
                var sWeekday = oDayFormat.format(date);
                return sWeekday;
            },

            /*-
             * This function replaces place holders in a format string with supplied parameters.
             * Example: i18nText("{0} and {1} are green", "Apples", "Bananas")
             * Result: "Apples and Bananas are green"
             */
            i18nText : function(format) {
                if (typeof (format) !== 'string') {
                    return;
                }
                var formattedText = format;
                for (var i = 1; i < arguments.length; i++) {
                    var argument = arguments[i];
                    if (argument === null || argument === undefined) {
                        return;
                    }
                    var placeholder = '{' + (i - 1) + '}';
                    formattedText = formattedText.replace(placeholder, arguments[i]);
                }
                return formattedText;
            },

            /**
             * Encode a string to be included into HTML. Caution: The calling view controller needs to call: jQuery.sap.includeStyleSheet("/sap/secmon/ui/commons/css/EmbeddedHTML.css");
             */
            encodeHTML : function(string) {
                if (string) {
                    string = string.trim();
                    if (string.length === 0) {
                        return "</p>";
                    }

                    // In a PDF, make the link text under the mouse show underlined
                    var clickableString = string.replace("text-decoration: none;", "");
                    // A PDF text should be selectable
                    var selectableString = clickableString.replace("user-select: none;", "");

                    // The input string might contain HTML with hard-coded width.
                    var regex = /(;\s*width:\s*)(\d{2,}).?(\d)*(px;)/gi;

                    var autoWidthString = selectableString.replace(regex, function(input, group1, group2, group3, group4) {
                        return ';width:auto;';
                    });

                    if (jQuery.sap.startsWith(autoWidthString, '<div') === false) {
                        autoWidthString = '<div class="wrappedText" style="max-width:790px">' + autoWidthString + '</div>';
                    }
                    return autoWidthString;
                } else {
                    return "<p/>";
                }
            },
            knowledgebaseFormatter : function(sKey, sName) {
                var oModel = this.getModel("i18nknowledge");
                var sText = oModel ? oModel.getProperty(sKey) : "";
                return sText === sKey ? sName : sText;
            },

            /**
             * all arguments (expected to be boolean) are ORed together
             */
            booleanORed : function() {
                return Array.prototype.some.call(arguments, function(oArgument) {
                    return oArgument === true;
                });
            },

            /**
             * all arguments (expected to be boolean) are ANDed together
             */
            booleanANDed : function() {
                return Array.prototype.every.call(arguments, function(oArgument) {
                    return oArgument === true;
                });
            },

            tableModeFormatter : function(isPrivilegeGranted) {
                return isPrivilegeGranted ? "MultiSelect" : "None";    
            }

        };
