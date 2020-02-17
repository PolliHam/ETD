sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.log.TimeRangeFilterDialog", {

    onInit : function() {
        this.applyCozyCompact();

        var oModel = new sap.ui.model.json.JSONModel({
            "relativeTimeRanges" : [ {
                "key" : "lastMinute",
                "name" : "1 minute",
                "ms" : 60000
            }, {
                "key" : "last2Minutes",
                "name" : "2 Minutes",
                "ms" : 120000
            }, {
                "key" : "last5Minutes",
                "name" : "5 Minutes",
                "ms" : 300000
            }, {
                "key" : "last10Minutes",
                "name" : "10 Minutes",
                "ms" : 600000
            }, {
                "key" : "last15Minutes",
                "name" : "15 Minutes",
                "ms" : 900000
            }, {
                "key" : "last20Minutes",
                "name" : "20 Minutes",
                "ms" : 1200000
            }, {
                "key" : "last30Minutes",
                "name" : "30 Minutes",
                "ms" : 1800000
            }, {
                "key" : "last45Minutes",
                "name" : "45 Minutes",
                "ms" : 2700000
            }, {
                "key" : "lastHour",
                "name" : "1 Hour",
                "ms" : 3600000
            }, {
                "key" : "last2Hours",
                "name" : "2 Hours",
                "ms" : 7200000
            }, {
                "key" : "last8Hours",
                "name" : "8 Hours",
                "ms" : 28800000
            }, {
                "key" : "lastDay",
                "name" : "1 Day",
                "ms" : 86400000
            }, {
                "key" : "lastWeek",
                "name" : "1 Week",
                "ms" : 604800000
            }, {
                "key" : "lastMonth",
                "name" : "1 Month",
                "ms" : 2592000000
            }, {
                "key" : "lastYear",
                "name" : "1 Year",
                "ms" : 31622400000
            } ]
        });

        this.getView().setModel(oModel, "TimeRanges");

    },

    onChange : function(oEvent) {
        var oData = this.getView().getModel().getData();
        oData.isRelative = false;

        if (oEvent.getParameter("id").endsWith("relativeRanges")) {
            oData.isRelative = true;

            oData.timeTo = new Date();
        } else {

            this.getView().byId("absoluteTimeFrom").setValueState("None");
            var aFrom = oData.selectedAbsoluteTimeFrom.split(":");
            if (aFrom.length !== 3) {
                this.getView().byId("absoluteTimeFrom").setValueState("Error");
                return;
            }

            if (isNaN(aFrom[0]) || isNaN(aFrom[1]) || isNaN(aFrom[2])) {
                this.getView().byId("absoluteTimeFrom").setValueState("Error");
                return;
            }

            var hourFrom = parseInt(aFrom[0]);
            var minFrom = parseInt(aFrom[1]);
            var secFrom = parseInt(aFrom[2]);

            oData.timeFrom = oData.selectedAbsoluteDateFrom;
            oData.timeFrom.setHours(hourFrom);
            oData.timeFrom.setMinutes(minFrom);
            oData.timeFrom.setSeconds(secFrom);

            this.getView().byId("absoluteTimeTo").setValueState("None");
            var aTo = oData.selectedAbsoluteTimeTo.split(":");
            if (aTo.length !== 3) {
                this.getView().byId("absoluteTimeTo").setValueState("Error");
                return;
            }

            if (isNaN(aTo[0]) || isNaN(aTo[1]) || isNaN(aTo[2])) {
                this.getView().byId("absoluteTimeTo").setValueState("Error");
                return;
            }

            var hourTo = parseInt(aTo[0]);
            var minTo = parseInt(aTo[1]);
            var secTo = parseInt(aTo[2]);

            oData.timeTo = oData.selectedAbsoluteDateTo;
            oData.timeTo.setHours(hourTo);
            oData.timeTo.setMinutes(minTo);
            oData.timeTo.setSeconds(secTo);
        }

        this.getView().getModel().setData(oData);
    }
});