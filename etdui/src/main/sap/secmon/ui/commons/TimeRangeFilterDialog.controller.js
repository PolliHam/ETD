/* globals oCommonFunctions */
jQuery.sap.require('sap.secmon.ui.m.commons.EtdController');
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.commons.TimeRangeFilterDialog", {

    onInit : function() {
        var _that = this;
        var oModel = new sap.ui.model.json.JSONModel({
            "relativeTimeRanges" : [ {
                "key" : "lastMinute",
                "name" : "1 minute",
                "ms" : 60000
            }, {
                "key" : "last2Minutes",
                "name" : "2 minutes",
                "ms" : 120000
            }, {
                "key" : "last5Minutes",
                "name" : "5 minutes",
                "ms" : 300000
            }, {
                "key" : "last10Minutes",
                "name" : "10 minutes",
                "ms" : 600000
            }, {
                "key" : "last15Minutes",
                "name" : "15 minutes",
                "ms" : 900000
            }, {
                "key" : "last20Minutes",
                "name" : "20 minutes",
                "ms" : 1200000
            }, {
                "key" : "last30Minutes",
                "name" : "30 minutes",
                "ms" : 1800000
            }, {
                "key" : "last45Minutes",
                "name" : "45 minutes",
                "ms" : 2700000
            }, {
                "key" : "lastHour",
                "name" : "1 hour",
                "ms" : 3600000
            }, {
                "key" : "last2Hours",
                "name" : "2 hours",
                "ms" : 7200000
            }, {
                "key" : "last8Hours",
                "name" : "8 hours",
                "ms" : 28800000
            }, {
                "key" : "lastDay",
                "name" : "1 day",
                "ms" : 86400000
            }, {
                "key" : "lastWeek",
                "name" : "1 week",
                "ms" : 604800000
            }, {
                "key" : "lastMonth",
                "name" : "1 month",
                "ms" : 2592000000
            }, {
                "key" : "lastYear",
                "name" : "1 year",
                "ms" : 31622400000
            } ],
            "absoluteTimes" : [ {
                "key" : "00:00:00",
                "text" : "00:00"
            }, {
                "key" : "01:00:00",
                "text" : "01:00"
            }, {
                "key" : "02:00:00",
                "text" : "02:00"
            }, {
                "key" : "03:00:00",
                "text" : "03:00"
            }, {
                "key" : "04:00:00",
                "text" : "04:00"
            }, {
                "key" : "05:00:00",
                "text" : "05:00"
            }, {
                "key" : "06:00:00",
                "text" : "06:00"
            }, {
                "key" : "07:00:00",
                "text" : "07:00"
            }, {
                "key" : "08:00:00",
                "text" : "08:00"
            }, {
                "key" : "09:00:00",
                "text" : "09:00"

            }, {
                "key" : "10:00:00",
                "text" : "10:00"
            }, {
                "key" : "11:00:00",
                "text" : "11:00"
            }, {
                time : "12:00:00",
                "text" : "12:00"
            }, {
                "key" : "13:00:00",
                "text" : "13:00"
            }, {
                "key" : "14:00:00",
                "text" : "14:00"
            }, {
                "key" : "15:00:00",
                "text" : "15:00"
            }, {
                "key" : "16:00:00",
                "text" : "16:00"
            }, {
                "key" : "17:00:00",
                "text" : "17:00"
            }, {
                time : "18:00:00",
                "text" : "18:00"
            }, {
                "key" : "19:00:00",
                "text" : "19:00"
            }, {
                "key" : "20:00:00",
                "text" : "20:00"
            }, {
                "key" : "21:00:00",
                "text" : "21:00"
            }, {
                "key" : "22:00:00",
                "text" : "22:00"
            }, {
                "key" : "23:00:00",
                "text" : "23:00"
            } ]
        });

        this.getView().setModel(oModel, "TimeRanges");
        var oDateTo = new Date();
        var oDateFrom = new Date(oDateTo.getTime() - 3600000);
        var sTimeFrom =
                (oDateFrom.getHours() < 10 ? "0" + oDateFrom.getHours() : "" + oDateFrom.getHours()) + ':' +
                        (oDateFrom.getMinutes() < 10 ? "0" + oDateFrom.getMinutes() : "" + oDateFrom.getMinutes()) + ':' +
                        (oDateFrom.getSeconds() < 10 ? "0" + oDateFrom.getSeconds() : "" + oDateFrom.getSeconds());
        var sTimeFromUTC =
                (oDateFrom.getUTCHours() < 10 ? "0" + oDateFrom.getUTCHours() : "" + oDateFrom.getUTCHours()) + ':' +
                        (oDateFrom.getUTCMinutes() < 10 ? "0" + oDateFrom.getUTCMinutes() : "" + oDateFrom.getUTCMinutes()) + ':' +
                        (oDateFrom.getUTCSeconds() < 10 ? "0" + oDateFrom.getUTCSeconds() : "" + oDateFrom.getUTCSeconds());
        var sTimeTo =
                (oDateTo.getHours() < 10 ? "0" + oDateTo.getHours() : "" + oDateTo.getHours()) + ':' + (oDateTo.getMinutes() < 10 ? "0" + oDateTo.getMinutes() : "" + oDateTo.getMinutes()) + ':' +
                        (oDateTo.getSeconds() < 10 ? "0" + oDateTo.getSeconds() : "" + oDateTo.getSeconds());
        var sTimeToUTC =
                (oDateTo.getUTCHours() < 10 ? "0" + oDateTo.getUTCHours() : "" + oDateTo.getUTCHours()) + ':' +
                        (oDateTo.getUTCMinutes() < 10 ? "0" + oDateTo.getUTCMinutes() : "" + oDateTo.getUTCMinutes()) + ':' +
                        (oDateTo.getUTCSeconds() < 10 ? "0" + oDateTo.getUTCSeconds() : "" + oDateTo.getUTCSeconds());

        this.getView().setModel(new sap.ui.model.json.JSONModel({
            "selectedRelativeTimeRange" : "lastHour",
            "selectedAbsoluteDateFrom" : oDateFrom,
            "selectedAbsoluteTimeFrom" : sTimeFrom,
            "selectedAbsoluteDateTo" : oDateTo,
            "selectedAbsoluteTimeTo" : sTimeTo,
            "selectedAbsoluteDateFromUTCString" : oCommonFunctions.formatDateTime(oDateFrom),
            "selectedAbsoluteDateToUTCString" : oCommonFunctions.formatDateTime(oDateTo),
            "selectedAbsoluteTimeFromUTC" : sTimeFromUTC,
            "selectedAbsoluteTimeToUTC" : sTimeToUTC
        }));

        this.getView().setModel(new sap.ui.model.json.JSONModel({
            "isLastEditable" : true,
            "isFromToEditable" : false
        }), "UIModel");

        this.getView().attachBrowserEvent("click", function(evt) {
            if (evt.target.nodeName === "DIV") {
                var oUIModel = _that.getView().getModel("UIModel");
                var oUIModelData = oUIModel.getData();
                if (evt.target.childNodes[0].id.indexOf("relativeRanges") !== -1) {
                    oUIModelData.isLastEditable = true;
                    oUIModelData.isFromToEditable = false;
                    oUIModel.setData(oUIModelData);
                } else if (evt.target.childNodes[0].id.indexOf("absolute") !== -1) {
                    oUIModelData.isLastEditable = false;
                    oUIModelData.isFromToEditable = true;
                    oUIModel.setData(oUIModelData);
                }
            }
        });
    },

    onChange : function(oEvent) {
        var oData = this.getView().getModel().getData();
        if (!this.UTC) {
            this.UTC = this.getView().getModel("applicationContext").getProperty("/UTC");
        }
        if (oEvent.getParameter("id").endsWith("relativeRanges")) {
            oData.selectedAbsoluteDateTo = new Date();
            oData.selectedAbsoluteTimeTo =
                    (oData.selectedAbsoluteDateTo.getHours() < 10 ? "0" + oData.selectedAbsoluteDateTo.getHours() : "" + oData.selectedAbsoluteDateTo.getHours()) + ':' +
                            (oData.selectedAbsoluteDateTo.getMinutes() < 10 ? "0" + oData.selectedAbsoluteDateTo.getMinutes() : "" + oData.selectedAbsoluteDateTo.getMinutes()) + ':' +
                            (oData.selectedAbsoluteDateTo.getSeconds() < 10 ? "0" + oData.selectedAbsoluteDateTo.getSeconds() : "" + oData.selectedAbsoluteDateTo.getSeconds());
            oData.selectedAbsoluteTimeToUTC =
                    (oData.selectedAbsoluteDateTo.getUTCHours() < 10 ? "0" + oData.selectedAbsoluteDateTo.getUTCHours() : "" + oData.selectedAbsoluteDateTo.getUTCHours()) + ':' +
                            (oData.selectedAbsoluteDateTo.getUTCMinutes() < 10 ? "0" + oData.selectedAbsoluteDateTo.getUTCMinutes() : "" + oData.selectedAbsoluteDateTo.getUTCMinutes()) + ':' +
                            (oData.selectedAbsoluteDateTo.getUTCSeconds() < 10 ? "0" + oData.selectedAbsoluteDateTo.getUTCSeconds() : "" + oData.selectedAbsoluteDateTo.getUTCSeconds());
            switch (oData.selectedRelativeTimeRange) {
            case "lastMinute":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 60000);
                break;
            case "last2Minutes":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 120000);
                break;
            case "last5Minutes":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 300000);
                break;
            case "last10Minutes":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 600000);
                break;
            case "last15Minutes":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 900000);
                break;
            case "last20Minutes":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 1200000);
                break;
            case "last30Minutes":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 1800000);
                break;
            case "last45Minutes":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 2700000);
                break;
            case "lastHour":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 3600000);
                break;
            case "last2Hours":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 7200000);
                break;
            case "last8Hours":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 28800000);
                break;
            case "lastDay":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 86400000);
                break;
            case "lastWeek":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 604800000);
                break;
            case "lastMonth":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 2592000000);
                break;
            case "lastYear":
                oData.selectedAbsoluteDateFrom = new Date(oData.selectedAbsoluteDateTo.getTime() - 31622400000);
                break;
            }
            oData.selectedAbsoluteTimeFrom =
                    (oData.selectedAbsoluteDateFrom.getHours() < 10 ? "0" + oData.selectedAbsoluteDateFrom.getHours() : "" + oData.selectedAbsoluteDateFrom.getHours()) + ':' +
                            (oData.selectedAbsoluteDateFrom.getMinutes() < 10 ? "0" + oData.selectedAbsoluteDateFrom.getMinutes() : "" + oData.selectedAbsoluteDateFrom.getMinutes()) + ':' +
                            (oData.selectedAbsoluteDateFrom.getSeconds() < 10 ? "0" + oData.selectedAbsoluteDateFrom.getSeconds() : "" + oData.selectedAbsoluteDateFrom.getSeconds());
            oData.selectedAbsoluteTimeFromUTC =
                    (oData.selectedAbsoluteDateFrom.getUTCHours() < 10 ? "0" + oData.selectedAbsoluteDateFrom.getUTCHours() : "" + oData.selectedAbsoluteDateFrom.getUTCHours()) + ':' +
                            (oData.selectedAbsoluteDateFrom.getUTCMinutes() < 10 ? "0" + oData.selectedAbsoluteDateFrom.getUTCMinutes() : "" + oData.selectedAbsoluteDateFrom.getUTCMinutes()) + ':' +
                            (oData.selectedAbsoluteDateFrom.getUTCSeconds() < 10 ? "0" + oData.selectedAbsoluteDateFrom.getUTCSeconds() : "" + oData.selectedAbsoluteDateFrom.getUTCSeconds());
        } else {
            // disable ok button in case of invalid user input
            this.getView().getParent().getButtons()[0].setEnabled(true);
            // date value changes
            var oDPFrom = this.getView().byId("absoluteDateFrom");
            var oDPFromNew = new Date(oDPFrom.getValue());
            oDPFrom.setValueState("None");
            if (isNaN(oDPFromNew.getTime())) {
                oDPFrom.setValueState("Error");
                this.getView().getParent().getButtons()[0].setEnabled(false);
                return;
            } else {
                oData.selectedAbsoluteDateFrom = oDPFromNew;
            }

            var oDPTo = this.getView().byId("absoluteDateTo");
            var oDPToNew = new Date(oDPTo.getValue());
            oDPTo.setValueState("None");
            if (isNaN(oDPToNew.getTime())) {
                oDPTo.setValueState("Error");
                this.getView().getParent().getButtons()[0].setEnabled(false);
                return;
            } else {
                oData.selectedAbsoluteDateTo = oDPToNew;
            }

            // time value changed
            this.getView().byId("absoluteTimeFrom").setValueState("None");
            var aFrom = oData.selectedAbsoluteTimeFrom.split(":");
            if (aFrom.length === 2) {
                if (isNaN(aFrom[0]) || isNaN(aFrom[1]) || aFrom[0].length !== 2 || aFrom[1].length !== 2 || parseInt(aFrom[0]) < 0 || parseInt(aFrom[0]) > 23 || parseInt(aFrom[1]) < 0 ||
                        parseInt(aFrom[1]) > 59) {
                    this.getView().byId("absoluteTimeFrom").setValueState("Error");
                    this.getView().getParent().getButtons()[0].setEnabled(false);
                    return;
                } else {
                    oEvent.getSource().setValue(oData.selectedAbsoluteTimeFrom + ":00");
                }
            }
            aFrom = oData.selectedAbsoluteTimeFrom.split(":");
            if (aFrom.length !== 3) {
                this.getView().byId("absoluteTimeFrom").setValueState("Error");
                this.getView().getParent().getButtons()[0].setEnabled(false);
                return;
            }

            if (isNaN(aFrom[0]) || isNaN(aFrom[1]) || isNaN(aFrom[2]) || aFrom[0].length !== 2 || aFrom[1].length !== 2 || aFrom[2].length !== 2 || parseInt(aFrom[0]) < 0 || parseInt(aFrom[0]) > 23 ||
                    parseInt(aFrom[1]) < 0 || parseInt(aFrom[1]) > 59 || parseInt(aFrom[2]) < 0 || parseInt(aFrom[2]) > 59) {
                this.getView().byId("absoluteTimeFrom").setValueState("Error");
                this.getView().getParent().getButtons()[0].setEnabled(false);
                return;
            }

            var hourFrom = parseInt(aFrom[0]);
            var minFrom = parseInt(aFrom[1]);
            var secFrom = parseInt(aFrom[2]);

            if (this.UTC) {
                oData.selectedAbsoluteDateFrom.setUTCHours(hourFrom);
                oData.selectedAbsoluteDateFrom.setUTCMinutes(minFrom);
                oData.selectedAbsoluteDateFrom.setUTCSeconds(secFrom);
            } else {
                oData.selectedAbsoluteDateFrom.setHours(hourFrom);
                oData.selectedAbsoluteDateFrom.setMinutes(minFrom);
                oData.selectedAbsoluteDateFrom.setSeconds(secFrom);
            }

            this.getView().byId("absoluteTimeTo").setValueState("None");
            var aTo = oData.selectedAbsoluteTimeTo.split(":");
            if (aTo.length === 2) {
                if (isNaN(aTo[0]) || isNaN(aTo[1]) || aTo[0].length !== 2 || aTo[1].length !== 2 || parseInt(aTo[0]) < 0 || parseInt(aTo[0]) > 23 || parseInt(aTo[1]) < 0 || parseInt(aTo[1]) > 59) {
                    this.getView().byId("absoluteTimeFrom").setValueState("Error");
                    this.getView().getParent().getButtons()[0].setEnabled(false);
                    return;
                } else {
                    oEvent.getSource().setValue(oData.selectedAbsoluteTimeTo + ":00");
                }
            }
            aTo = oData.selectedAbsoluteTimeTo.split(":");
            if (aTo.length !== 3) {
                this.getView().byId("absoluteTimeTo").setValueState("Error");
                this.getView().getParent().getButtons()[0].setEnabled(false);
                return;
            }
            if (isNaN(aTo[0]) || isNaN(aTo[1]) || isNaN(aTo[2]) || aTo[0].length !== 2 || aTo[1].length !== 2 || aTo[2].length !== 2 || parseInt(aTo[0]) < 0 || parseInt(aTo[0]) > 23 ||
                    parseInt(aTo[1]) < 0 || parseInt(aTo[1]) > 59 || parseInt(aTo[2]) < 0 || parseInt(aTo[2]) > 59) {
                this.getView().byId("absoluteTimeTo").setValueState("Error");
                this.getView().getParent().getButtons()[0].setEnabled(false);
                return;
            }
            var hourTo = parseInt(aTo[0]);
            var minTo = parseInt(aTo[1]);
            var secTo = parseInt(aTo[2]);
            if (this.UTC) {
                oData.selectedAbsoluteDateTo.setUTCHours(hourTo);
                oData.selectedAbsoluteDateTo.setUTCMinutes(minTo);
                oData.selectedAbsoluteDateTo.setUTCSeconds(secTo);
            } else {
                oData.selectedAbsoluteDateTo.setHours(hourTo);
                oData.selectedAbsoluteDateTo.setMinutes(minTo);
                oData.selectedAbsoluteDateTo.setSeconds(secTo);
            }
            this.getView().byId("absoluteDateTo").setValueState("None");
            this.getView().byId("absoluteTimeTo").setValueState("None");
            if (oData.selectedAbsoluteDateTo.getTime() < oData.selectedAbsoluteDateFrom.getTime()) {
                this.getView().byId("absoluteDateTo").setValueState("Error");
                this.getView().byId("absoluteTimeTo").setValueState("Error");
                this.getView().getParent().getButtons()[0].setEnabled(false);
                return;
            }
        }
        oData.selectedAbsoluteDateToUTCString = oCommonFunctions.formatDateTime(oData.selectedAbsoluteDateTo);
        oData.selectedAbsoluteDateFromUTCString = oCommonFunctions.formatDateTime(oData.selectedAbsoluteDateFrom);
        this.getView().getModel().setData(oData);
    }
});