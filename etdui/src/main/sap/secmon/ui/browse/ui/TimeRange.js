$.sap.declare("sap.secmon.ui.browse.TimeRange");
$.sap.require("sap.secmon.ui.browse.Constants");

// TODO: Update DOCU
/**
 * Custom control to enable assignment of absolute and relative time ranges Assume that the time interval of relative time is set in the model: TimeRangeModel
 * 
 * Format of the relative interval: { key: "1minute", name: "1 Minute", ms : 600000 }
 * 
 * Example:
 * 
 * var oTimeRangeSelector = new sap.secmon.ui.browse.TimeRange({ type : sTRType, value : 
 * { relativeValue : sRelativeValue, absoluteValue : { from : sFromTS, to : sToTS } }, relativeIntervals : { path :
 * "TimeRangeModel>/", template : new sap.ui.base.ManagedObject(), templateShareable : false } });
 * 
 * 
 */

sap.ui.core.Control.extend("sap.secmon.ui.browse.TimeRange", {
    metadata : {
        properties : {
            width : {
                type : "sap.ui.core.CSSSize",
                defaultValue : "275px",
            },
            type : {
                type : "string",
                defaultValue : "Relative" // Relative | Absolute
            },
            visibleTo : {
                type : "boolean",
                defaultValue : true
            },
            value : {
                type : "any",
                defaultValue : {
                    showUTC : {
                        type : "boolean",
                        defaultValue : true
                    },
                    relativeValue : {
                        type : "string",
                        defaultValue : sap.secmon.ui.browse.Constants.C_TIMERANGE.LAST_HOUR
                    }
                }
            // showUTC : true,
            // relativeValue : lastHour,
            // absoluteValue : {
            // from : "20140613T134412",
            // to : "20140614T134412"
            // }
            }
        },
        aggregations : {
            _layout : {
                type : "sap.m.VBox",
                multiple : false,
                visibility : "hidden"
            },
            relativeIntervals : {
                type : "sap.ui.base.ManagedObject"
            }
        },
        events : {
            change : {}
        }
    },

    TYPE_RELATIVE : "Relative",
    TYPE_ABSOLUTE : "Absolute",
    TZ_UTC : "UTC",

    _relativeTimeRange : undefined,
    _absoluteDateFrom : undefined,
    _absoluteTimeFrom : undefined,
    _absoluteDateTo : undefined,
    _absoluteTimeTo : undefined,
    _timeZoneFrom : undefined,
    _timeZoneTo : undefined,
    _bRelativeItemsSet : false,

    _toISOLike : function(dtVal) {
        var oDateTimeFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
            pattern : "yyyy-MM-ddTHH:mm:ss"
        });
        return oDateTimeFormat.format(dtVal) + "Z";
    },

    _getAbs4Rel : function(sValRel, sValAbs) {
        if (!sValRel) {
            return {
                from : sValAbs.from,
                to : sValAbs.to
            };
        } else {
            var dtTo = new Date();
            var dtFrom = new Date(dtTo.getTime() - sap.secmon.ui.browse.Constants.C_REL_TIME_LIST[sValRel]);
            return {
                from : sap.secmon.ui.browse.utils.formatDateTime(dtFrom),
                to : sap.secmon.ui.browse.utils.formatDateTime(dtTo)
            };
        }
    },

    /**
     * formatting for a timestamp, including date and time.
     */
    formatDatetime : function(isUtc, oDate, sDatePattern, sTimePattern) {
        if (!oDate) {
            throw "Date object is not supplied";
        }

        var sDateTime;
        jQuery.sap.require("sap.ui.core.format.DateFormat");
        var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
            style : "short",
            pattern : sDatePattern || "yyyy-MM-dd",
            UTC : isUtc
        });
        sDateTime = oDateFormat.format(new Date(oDate)) + " ";
        oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
            style : "long",
            pattern : sTimePattern || "HH:mm:ss z",
            UTC : isUtc
        });
        sDateTime = sDateTime + oDateFormat.format(new Date(oDate));
        return sDateTime.replace("GMTZ", "UTC");
    },

    checkValidation : function(oValue) {
        var sDateFrom = this._absoluteDateFrom.getValue();
        var sDateTo = this._absoluteDateTo.getValue();
        var sTimeTo = this._absoluteTimeTo.getValue();
        var sTimeFrom = this._absoluteTimeFrom.getValue();
       var bTimeFormat = this.checkTimeFormat(sTimeTo.split(":"), sTimeFrom.split(":"));
        if (sDateFrom > sDateTo) {
            this.getModel("validCheckModel").setProperty("/fieldName", "absoluteDatePicker");
        } else if (sDateFrom === sDateTo && sTimeTo < sTimeFrom || !bTimeFormat) {
            this.getModel("validCheckModel").setProperty("/fieldName", "absoluteTimeTo");
        } else {
            this.getModel("validCheckModel").setProperty("/fieldName", "None");
        }
    },

    checkTimeFormat : function(aTimeTo, aTimeFrom){
        var aTimeToResult = aTimeTo.filter(function(item){
            return item.length === 2;
        });
        var aTimeFromResult = aTimeFrom.filter(function(item){
            return item.length === 2;
        });

        return (aTimeFromResult.length === 3 && aTimeToResult.length === 3);
    },

    setValue : function(oValue) {
        // resolve the relative value to absolute for UI consistency
        if (this.getType() === "Relative" && oValue.relativeValue !== "") {
            this._relativeTimeRange.setSelectedKey(oValue.relativeValue);
            oValue.absoluteValue = this._getAbs4Rel(oValue.relativeValue, oValue.absoluteValue);
            oValue.absoluteValue = this._getAbs4Rel(oValue.relativeValue, oValue.absoluteValue);
        } else if (this.getType() === "Absolute" && oValue.absoluteValue !== "") {
            this._relativeTimeRange.setSelectedKey(null);
        }
        // for backwards compatibility use the default value of showUTC which is true => see above
        if (oValue.showUTC === undefined) {
            oValue.showUTC = this.getValue().showUTC;
        }
        this.setProperty("value", oValue, true);

        var sDate;

        // get local time to show
        // sDate = sap.secmon.ui.commons.Formatter.dateFormatterEx(oValue.showUTC, new Date(oValue.absoluteValue.from));
        sDate = this.formatDatetime(oValue.showUTC, new Date(oValue.absoluteValue.from));
        this._absoluteDateFrom.setValue(sDate.substr(0, 10));
        this._absoluteTimeFrom.setValue(sDate.substr(11, 8));

        if (this.getVisibleTo()) {
            sDate = this.formatDatetime(oValue.showUTC, new Date(oValue.absoluteValue.to));
            this._absoluteDateTo.setValue(sDate.substr(0, 10));
            this._absoluteTimeTo.setValue(sDate.substr(11, 8));
        }
        // get and display the time zone info
        var sTimeZone = sDate.substr(20);

        this._timeZoneFrom.setText(sTimeZone);
        this._timeZoneTo.setText(sTimeZone);
    },

    /**
     * 
     * get the user selection when showUTC is true then the selected times are in GMT+00:00 (i.e.UTC) and do not need to be converted when showUTC is false then the selected times are in the
     * respective local time zone (TZ) and have to be converted to the ZERO TZ
     */
    _handleAbsoluteChange : function() {
        // from
        var dtFrom = this._absoluteDateFrom.getDateValue();
        dtFrom.setHours(0);
        dtFrom.setMinutes(0);
        dtFrom.setSeconds(0);
        dtFrom.setMilliseconds(0);
        var iFromMs = dtFrom.getTime();
        var aTimeFrom = this._absoluteTimeFrom.getValue().split(":");
        iFromMs = iFromMs + parseInt(aTimeFrom[0]) * 60 * 60 * 1000 + parseInt(aTimeFrom[1]) * 60 * 1000;
        if (aTimeFrom[2] && aTimeFrom[2].length) {
            iFromMs = iFromMs + parseInt(aTimeFrom[2]) * 1000;
        }
        // to
        var dtTo = this._absoluteDateTo.getDateValue();
        dtTo.setHours(0);
        dtTo.setMinutes(0);
        dtTo.setSeconds(0);
        dtTo.setMilliseconds(0);
        var iToMs = dtTo.getTime();
        var aTimeTo = this._absoluteTimeTo.getValue().split(":");
        iToMs = iToMs + parseInt(aTimeTo[0]) * 60 * 60 * 1000 + parseInt(aTimeTo[1]) * 60 * 1000;
        if (aTimeTo[2] && aTimeTo[2].length) {
            iToMs = iToMs + parseInt(aTimeTo[2]) * 1000;
        }

        var bShowUTC = this.getValue().showUTC;
        var sFrom = bShowUTC ? this._toISOLike(new Date(iFromMs)) : sap.secmon.ui.browse.utils.formatDateTime(new Date(iFromMs));
        var sTo = bShowUTC ? this._toISOLike(new Date(iToMs)) : sap.secmon.ui.browse.utils.formatDateTime(new Date(iToMs));
        this.setValue({
            absoluteValue : {
                from : sFrom,
                to : sTo
            },
            showUTC : bShowUTC
        });
        this.fireChange({});
    },

    setType : function(sType) {
        this.setProperty("type", sType, true);
        this._relativeTimeRange.setEnabled(sType === this.TYPE_RELATIVE);
        this._absoluteDateFrom.setEnabled(sType === this.TYPE_ABSOLUTE);
        this._absoluteTimeFrom.setEnabled(sType === this.TYPE_ABSOLUTE);
        this._absoluteDateTo.setEnabled(sType === this.TYPE_ABSOLUTE);
        this._absoluteTimeTo.setEnabled(sType === this.TYPE_ABSOLUTE);
    },

    setVisibleTo : function(bVisible) {
        this.setProperty("visibleTo", bVisible, true);
        this._absoluteDateTo.setVisible(bVisible);
        this._absoluteTimeTo.setVisible(bVisible);
        this._timeZoneTo.setVisible(bVisible);
    },

    exit : function() {
        this._relativeTimeRange = null;
        this._absoluteDateFrom = null;
        this._absoluteTimeFrom = null;
        this._absoluteDateTo = null;
        this._absoluteTimeTo = null;
        this._timeZoneFrom = null;
        this._timeZoneTo = null;
    },

    init : function() {
        var that = this;
        var oTo = new Date();
        var oFrom = new Date(oTo.getTime() - 3600 * 1000);

        var sTo = sap.secmon.ui.browse.utils.formatDateTime(oTo);
        var sToTime = sTo.substr(11, 5);
        var sFrom = sap.secmon.ui.browse.utils.formatDateTime(oFrom);
        var sFromTime = sFrom.substr(11, 5);

        var sTimeZone = this.TZ_UTC;

        this._relativeTimeRange = new sap.m.ComboBox({
            // enabled : {
            // path : "TimeRangeModel>/",
            // formatter : function(sVal) {
            // return that.getType() === that.TYPE_RELATIVE;
            // }
            // },
            width : "100%",
            selectedKey : "lastHour",
            valueState : "{=${validCheckModel>/fieldName} === 'relativeTimeRange' ? 'Error' : 'None'}",
            selectionChange : function(oEvent) {
                this.setValue({
                    relativeValue : oEvent.getSource().getSelectedKey(),
                    showUTC : this.getValue().showUTC
                });
                this.fireChange({});
                this.checkValidation();
            }.bind(this)
        });
        this._relativeTimeRange.addStyleClass('sapEtdRelativeTime');

        // Start of the time range
        this._absoluteDateFrom = new sap.m.DatePicker({
            enabled : {
                path : "/",
                formatter : function(sVal) {
                    return that.getType() === that.TYPE_ABSOLUTE;
                }
            },
            valueFormat : "yyyyMMdd",
            // dateValue : oFrom,
            dateValue : {
                path : "/",
                formatter : function(sVal) {
                    return oFrom;
                }
            },
            tooltip : "{i18n>BU_TOL_SelStartDate}",
            change : function(oEvent, oControlle) {
                that._handleAbsoluteChange();
                that.checkValidation();
            },
        });

        this._absoluteTimeFrom = new sap.m.ComboBox({
            enabled : {
                path : "/",
                formatter : function(sVal) {
                    return that.getType() === that.TYPE_ABSOLUTE;
                }
            },
            tooltip : "{i18n>BU_TOL_SelStartTime}",
            editable : true,
            width : "100%",
            value : sFromTime,
            change : function(oEvent, oController) {
                that._handleAbsoluteChange();
                that.checkValidation();
            },

        }).attachBrowserEvent("keyup", function(){
            that.checkValidation();
            if(this.getModel("validCheckModel").getProperty("/fieldName") === "None"){
                that._handleAbsoluteChange();
            }
        });

        sap.secmon.ui.browse.Constants.C_ABS_TIME_LIST.forEach(function(oTime) {
            that._absoluteTimeFrom.addItem(new sap.ui.core.ListItem({
                text : oTime.time
            }));
        });

        this._timeZoneFrom = new sap.m.Label({
            text : sTimeZone
        });

        // End of the time range
        this._absoluteDateTo = new sap.m.DatePicker({
            visible : {
                path : "/",
                formatter : function(sVal) {
                    return that.getVisibleTo();
                }
            },
            valueState : "{=${validCheckModel>/fieldName} === 'absoluteDatePicker' ? 'Error' : 'None'}",
            enabled : {
                path : "/",
                formatter : function(sVal) {
                    return that.getType() === that.TYPE_ABSOLUTE;
                }
            },
            valueFormat : "yyyyMMdd",
            dateValue : oTo,
            tooltip : "{i18n>BU_TOL_SelEndDate}",
            change : function(oEvent, oController) { 
                that._handleAbsoluteChange();             
                that.checkValidation();
            },
        });

        this._absoluteTimeTo = new sap.m.ComboBox({
            visible : {
                path : "/",
                formatter : function(sVal) {
                    return that.getVisibleTo();
                }
            },
            enabled : {
                path : "/",
                formatter : function(sVal) {
                    return that.getType() === that.TYPE_ABSOLUTE;
                }
            },
            valueState : "{=${validCheckModel>/fieldName} === 'absoluteTimeTo' ? 'Error' : 'None'}",
            tooltip : "{i18n>BU_TOL_SelEndTime}",
            editable : true,
            width : "100%",
            value : sToTime,
            change : function(oEvent, oController) { 
                that._handleAbsoluteChange();
                that.checkValidation();
            },
        }).attachBrowserEvent("keyup", function(){
            that.checkValidation();
            if(this.getModel("validCheckModel").getProperty("/fieldName") === "None"){
                that._handleAbsoluteChange();
            }
        });
        sap.secmon.ui.browse.Constants.C_ABS_TIME_LIST.forEach(function(oTime) {
            that._absoluteTimeTo.addItem(new sap.ui.core.ListItem({
                text : oTime.time
            }));
        });

        this._timeZoneTo = new sap.m.Label({
            visible : {
                path : "/",
                formatter : function(sVal) {
                    return that.getVisibleTo();
                }
            },
            text : sTimeZone
        });

        this._layout = new sap.m.VBox({
            items : [ this._relativeTimeRange, new sap.m.HBox({
                alignItems : sap.m.FlexAlignItems.Center,
                items : [ this._absoluteDateFrom, this._absoluteTimeFrom, this._timeZoneFrom ]
            }), new sap.m.HBox({
                alignItems : sap.m.FlexAlignItems.Center,
                items : [ this._absoluteDateTo, this._absoluteTimeTo, this._timeZoneTo ]
            }) ]
        });

        this._layout.attachBrowserEvent("click", function(evt) {
            if (evt.target.nodeName === "DIV" && evt.target.children) {
                if (evt.target.children[0].className.indexOf("sapEtdRelativeTime") > -1) {
                    that.setType(sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_RELATIVE);
                    if (!that._relativeTimeRange.getSelectedKey()) {
                        that.getModel("validCheckModel").setProperty("/fieldName", "relativeTimeRange");
                    }
                } else {
                    that.setType(sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_ABSOLUTE);
                    that.checkValidation();
                }
                that.fireChange({});
            }
        });

        this.setAggregation("_layout", this._layout);

        // Create the validCheckModel
        this.setModel(new sap.ui.model.json.JSONModel({
            fieldName : "None"
        }), "validCheckModel");
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl); // writes the Control ID and enables
        oRm.writeClasses(); // there is no class to write, but this enables
        oRm.write(">");
        oRm.renderControl(oControl.getAggregation("_layout"));
        oRm.write("</div>"); // end of the complete Control
    },

    onBeforeRendering : function() {
    },

    onAfterRendering : function() {

        if (sap.ui.core.Control.prototype.onAfterRendering) {
            sap.ui.core.Control.prototype.onAfterRendering.apply(this, arguments);
        }

        var that = this;

        // get the binding information
        var oBindingInfo = this.getBindingInfo("relativeIntervals");
        var oModel = oBindingInfo.model ? sap.ui.getCore().getModel(oBindingInfo.model) : this.getModel();
        var aData = oModel.getProperty(oBindingInfo.path);

        if (aData.length && !this._bRelativeItemsSet) {
            this._relativeTimeRange.removeAllItems();
            (aData || []).forEach(function(oData) {
                that._relativeTimeRange.addItem(new sap.ui.core.Item({
                    key : oData.key,
                    text : oData.name
                }));
            });
            if (this.getType() === this.TYPE_RELATIVE) {
                this._relativeTimeRange.setSelectedKey(this.getValue().relativeValue);
            }
            this._bRelativeItemsSet = true;
        }
    },

});