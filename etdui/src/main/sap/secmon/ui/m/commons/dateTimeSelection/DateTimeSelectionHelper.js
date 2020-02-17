jQuery.sap.declare("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");

jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

sap.ui.base.Object.extend("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper", {

    MIN_TIME : "00:00:00",
    MAX_TIME : "23:59:59",

    constructor : function(oView) {
        this.oView = oView;

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.UTC = this.oView.getModel("applicationContext").getData().UTC;
    },

    getDefaultSelectionAsObject : function() {
        return {
            timeSelectionType : "relative",
            timeLast : "1",
            timeType : "days"
        };
    },

    getSelectionAsObject : function() {
        var selectionAsObject = {};

        var oView = this.oView;

        var oRbRelativeTimeRange = oView.byId("relativeTimeRange");
        var oInputTimeLast = oView.byId("inputTimeLast");
        var oSelectTimeLast = oView.byId("selectTimeLast");

        var oRbAbsoluteTimeRange = oView.byId("absoluteTimeRange");
        var oDatePickerTimeRangeFrom = oView.byId("datePickerTimeRangeFrom");
        var oInputTimeRangeFrom = oView.byId("inputTimeRangeFrom");
        var oDatePickerTimeRangeTo = oView.byId("datePickerTimeRangeTo");
        var oInputTimeRangeTo = oView.byId("inputTimeRangeTo");

        if (oRbRelativeTimeRange.getSelected()) {
            selectionAsObject.timeSelectionType = "relative";
            selectionAsObject.timeLast = oInputTimeLast.getValue() || "";
            selectionAsObject.timeType = oSelectTimeLast.getSelectedKey() || "days";
        } else if (oRbAbsoluteTimeRange.getSelected()) {
            selectionAsObject.timeSelectionType = "absolute";
            selectionAsObject.timeFromDate = this._convertDateToString(oDatePickerTimeRangeFrom.getDateValue(), oInputTimeRangeFrom.getValue() || "", this.MIN_TIME);
            selectionAsObject.timeToDate = this._convertDateToString(oDatePickerTimeRangeTo.getDateValue(), oInputTimeRangeTo.getValue() || "", this.MAX_TIME);
        }

        return selectionAsObject;
    },

    /*
     * Precondition: oDate is provided by an input control. UI might run in "UTC" mode, in this case oDate is "adjusted"
     */
    _convertDateToString : function(oDate, sTime, sDefaultTime) {
        if (!oDate) {
            return "";
        }

        // use the specified time for serialization so that the reconstructed
        // date is the one which
        // was set by the user; for example: fiji islands is UTC+12; if the
        // local time of the user is 7 AM and the
        // user sends a link (02.06.2015 7 AM - 02.06.2015 8 AM) to someone in
        // germany (UTC+2, summer time)
        // the recipient should see the time range 01.06.2005 21 PM - 01.06.2015
        // 22 PM
        /*
         * var oNowAt = new Date(); oNowAt.setFullYear(oDate.getFullYear(), oDate.getMonth(), oDate.getDate());
         */
        var oDateAt = new Date(oDate.getTime());
        var oTimeAt = this.oCommons.parseTime(sTime) || this.oCommons.parseTime(sDefaultTime);
        var nHours = oTimeAt.getHours();
        var nMinutes = oTimeAt.getMinutes();
        var nSeconds = oTimeAt.getSeconds();
        oDateAt.setHours(nHours, nMinutes, nSeconds);

        if (this.UTC) {
            oDateAt = this.oCommons.adjustTimeInputToUTC(oDateAt);
        }
        return oDateAt.getTime() + "";
    },

    /*
     * Precondition: Date object is provided for an input control. UI might run in "UTC" mode, in this case Date object is "adjusted"
     */
    _convertStringToDate : function(sValue) {
        if (!sValue) {
            return null;
        }

        var oDate = new Date(parseInt(sValue, 10));
        if (this.UTC) {
            oDate = this.oCommons.adjustDateForInputInUTC(oDate);
        }
        return oDate;
    },

    /*
     * Precondition: Date object is provided for an input control. UI might run in "UTC" mode, in this case Date object is "adjusted"
     */
    _convertStringToTime : function(sValue) {
        if (!sValue) {
            return null;
        }

        var oDate = new Date(parseInt(sValue, 10));
        if (this.UTC) {
            oDate = this.oCommons.adjustDateForInputInUTC(oDate);
        }
        return this.oCommons.formatTwoDigits(oDate.getHours()) + ":" + this.oCommons.formatTwoDigits(oDate.getMinutes()) + ":" + this.oCommons.formatTwoDigits(oDate.getSeconds());
    },

    reset : function() {
        var oView = this.oView;

        var oRbRelativeTimeRange = oView.byId("relativeTimeRange");
        var oInputTimeLast = oView.byId("inputTimeLast");
        var oSelectTimeLast = oView.byId("selectTimeLast");

        var oRbAbsoluteTimeRange = oView.byId("absoluteTimeRange");
        var oDatePickerTimeRangeFrom = oView.byId("datePickerTimeRangeFrom");
        var oInputTimeRangeFrom = oView.byId("inputTimeRangeFrom");
        var oDatePickerTimeRangeTo = oView.byId("datePickerTimeRangeTo");
        var oInputTimeRangeTo = oView.byId("inputTimeRangeTo");

        oRbRelativeTimeRange.setSelected(false);
        oInputTimeLast.setValue("");
        oSelectTimeLast.setSelectedKey("days");

        oRbAbsoluteTimeRange.setSelected(false);
        oDatePickerTimeRangeFrom.setDateValue(null);
        oDatePickerTimeRangeFrom.setValueState(sap.ui.core.ValueState.None);
        oInputTimeRangeFrom.setValue("");
        oInputTimeRangeFrom.setValueState(sap.ui.core.ValueState.None);
        oDatePickerTimeRangeTo.setDateValue(null);
        oDatePickerTimeRangeTo.setValueState(sap.ui.core.ValueState.None);
        oInputTimeRangeTo.setValue("");
        oInputTimeRangeTo.setValueState(sap.ui.core.ValueState.None);
    },

    selectFromObject : function(oSelection) {
        var oView = this.oView;

        var oRbRelativeTimeRange = oView.byId("relativeTimeRange");
        var oInputTimeLast = oView.byId("inputTimeLast");
        var oSelectTimeLast = oView.byId("selectTimeLast");

        var oRbAbsoluteTimeRange = oView.byId("absoluteTimeRange");
        var oDatePickerTimeRangeFrom = oView.byId("datePickerTimeRangeFrom");
        var oInputTimeRangeFrom = oView.byId("inputTimeRangeFrom");
        var oDatePickerTimeRangeTo = oView.byId("datePickerTimeRangeTo");
        var oInputTimeRangeTo = oView.byId("inputTimeRangeTo");

        if (oSelection.timeSelectionType === "relative") {
            oRbRelativeTimeRange.setSelected(true);
            oRbAbsoluteTimeRange.setSelected(false);

            oInputTimeLast.setValue(oSelection.timeLast || "");
            oSelectTimeLast.setSelectedKey(oSelection.timeType || "days");
        } else if (oSelection.timeSelectionType === "absolute") {
            oRbRelativeTimeRange.setSelected(false);
            oRbAbsoluteTimeRange.setSelected(true);

            oDatePickerTimeRangeFrom.setDateValue(this._convertStringToDate(oSelection.timeFromDate));
            oInputTimeRangeFrom.setValue(this._convertStringToTime(oSelection.timeFromDate || ""));
            oDatePickerTimeRangeTo.setDateValue(this._convertStringToDate(oSelection.timeToDate));
            oInputTimeRangeTo.setValue(this._convertStringToTime(oSelection.timeToDate || ""));
        }
    },

    isRelative : function() {
        return this.oView.byId("relativeTimeRange").getSelected();
    },

    getRelativeTimeInput : function() {
        return this.oView.byId("inputTimeLast").getValue();
    },

    getRelativeTimeUnit : function() {
        return this.oView.byId("selectTimeLast").getSelectedKey();
    },

    isAbsolute : function() {
        return this.oView.byId("absoluteTimeRange").getSelected();
    },

    getTimeRangeUnderConsideration : function(bNoTimeRefresh) {
        var oView = this.oView;

        var oRbRelativeTimeRange = oView.byId("relativeTimeRange");
        var oInputTimeLast = oView.byId("inputTimeLast");
        var oSelectTimeLast = oView.byId("selectTimeLast");

        var oRbAbsoluteTimeRange = oView.byId("absoluteTimeRange");
        var oDatePickerTimeRangeFrom = oView.byId("datePickerTimeRangeFrom");
        var oInputTimeRangeFrom = oView.byId("inputTimeRangeFrom");
        var oDatePickerTimeRangeTo = oView.byId("datePickerTimeRangeTo");
        var oInputTimeRangeTo = oView.byId("inputTimeRangeTo");

        var aRelativeTimeControls = [ oRbRelativeTimeRange, oInputTimeLast, oSelectTimeLast ];
        var aAbsoluteTimeControls = [ oRbAbsoluteTimeRange, oDatePickerTimeRangeFrom, oInputTimeRangeFrom, oDatePickerTimeRangeTo, oInputTimeRangeTo ];

        function fnMarkControlWithErrorState(oControl, bError) {
            if (oControl.setValueState) {
                oControl.setValueState(bError ? sap.ui.core.ValueState.Error : sap.ui.core.ValueState.None);
            }
        }

        if (typeof aRelativeTimeControls.oRbRelativeTimeRange !== "undefined") {
            aRelativeTimeControls.concat(aAbsoluteTimeControls).forEach(function(oControl) {
                fnMarkControlWithErrorState(oControl, false);
            });
        } else {
            aAbsoluteTimeControls.forEach(function(oControl) {
                fnMarkControlWithErrorState(oControl, false);
            });
        }

        var from = new Date();
        var to = new Date();

        if (bNoTimeRefresh === true && this.from && this.to) {
            return [ this.from, this.to ];
        }

        var aBadControls = [];

        // Relative Radio button for relative datetimerange might be not available in all cases
        // Therefore it is checked against its definition and if it was selected by the enduser
        // Equally the availability of the absolute datetimerange is selected
        if ((typeof oRbRelativeTimeRange !== "undefined") && (oRbRelativeTimeRange.getSelected())) {
            var sInputTimeLast = oInputTimeLast.getValue();
            var inputTimeLast = parseInt(sInputTimeLast, 10);

            if (sInputTimeLast === String(inputTimeLast) && inputTimeLast > 0) {
                switch (oSelectTimeLast.getSelectedKey()) {
                case "minutes":
                    from.setMinutes(from.getMinutes() - inputTimeLast);
                    break;
                case "hours":
                    from.setHours(from.getHours() - inputTimeLast);
                    break;
                case "days":
                    from.setHours(from.getHours() - (inputTimeLast * 24));
                    break;
                }
                this.from = from;
                this.to = to;
                return [ from, to ];
            } else {
                aBadControls.push(oInputTimeLast);
            }
        } else if ((typeof oRbAbsoluteTimeRange !== "undefined") && (oRbAbsoluteTimeRange.getSelected())) {
            var oDateValueFrom = oDatePickerTimeRangeFrom.getDateValue();
            var sInputTimeRangeFrom = oInputTimeRangeFrom.getValue();
            var oDateValueTo = oDatePickerTimeRangeTo.getDateValue();
            var sInputTimeRangeTo = oInputTimeRangeTo.getValue();

            if (!sInputTimeRangeFrom) {
                sInputTimeRangeFrom = this.MIN_TIME;
            }
            if (!sInputTimeRangeTo) {
                sInputTimeRangeTo = this.MAX_TIME;
            }

            var dInputTimeRangeFrom = this.oCommons.parseTime(sInputTimeRangeFrom);
            var dInputTimeRangeTo = this.oCommons.parseTime(sInputTimeRangeTo);

            if (dInputTimeRangeFrom && dInputTimeRangeTo && oDateValueFrom && oDateValueTo) {
                from = new Date(oDateValueFrom.getTime());
                from.setHours(dInputTimeRangeFrom.getHours(), dInputTimeRangeFrom.getMinutes(), dInputTimeRangeFrom.getSeconds());

                to = new Date(oDateValueTo.getTime());
                to.setHours(dInputTimeRangeTo.getHours(), dInputTimeRangeTo.getMinutes(), dInputTimeRangeTo.getSeconds());

                if (from.getTime() <= to.getTime()) {
                    this.from = from;
                    this.to = to;
                    if (this.UTC) {
                        return [ this.oCommons.adjustTimeInputToUTC(from), this.oCommons.adjustTimeInputToUTC(to) ];
                    } else {
                        return [ from, to ];
                    }
                } else {
                    aBadControls.push(oDatePickerTimeRangeFrom);
                    aBadControls.push(oDatePickerTimeRangeTo);
                }
            } else {
                if (!oDateValueFrom) {
                    aBadControls.push(oDatePickerTimeRangeFrom);
                }
                if (!dInputTimeRangeFrom) {
                    aBadControls.push(oInputTimeRangeFrom);
                }
                if (!oDateValueTo) {
                    aBadControls.push(oDatePickerTimeRangeTo);
                }
                if (!dInputTimeRangeTo) {
                    aBadControls.push(oInputTimeRangeTo);
                }
            }
        } else {
            aBadControls.push(oRbRelativeTimeRange);
            aBadControls.push(oRbAbsoluteTimeRange);
        }

        aBadControls.forEach(function(oControl) {
            fnMarkControlWithErrorState(oControl, true);
        });

    },

});
