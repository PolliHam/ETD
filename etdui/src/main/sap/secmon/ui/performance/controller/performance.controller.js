/* globals oTextBundle */
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.m.MessageToast");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.performance.controller.performance", {
    oCommons : new sap.secmon.ui.commons.CommonFunctions(),

    /*
     * @method called on Initialization
     */
    onInit : function() {
        this.loadData(this);
        this.sCurrentView = "HANA";
        this.setView(this);

        this.getView().byId("idDetailList").addEventDelegate({
            onAfterRendering : function(oEvt) {
                var item = $("#__item0-__xmlview0--idDetailList-0-content");
                var chartId = oEvt.srcControl.getParent().getParent().getParent().getParent().getParent().getParent().byId('idChart').sId;
                item.empty();
                item.append('<svg id="listLegend"></svg>');
                $('#listLegend').append($('.' + chartId + '--container--legend--items'));
                $('#listLegend').css('height', function() {
                    return $('#listLegend').children().length * 20;
                });
                item.parent().css('height', function() {
                    return $('#listLegend').children().length * 20 + 5;
                });
            }
        });
    },

    /*
     * @method called when IconTabBarItem clicked, call set View function for current View @param {oEvt}
     */

    onSelectTab : function(oEvt) {
        // CHECK WHICH TAB SELECTED
        var key = oEvt.getParameters().key;
        if (key === "HANATab") {
            this.sCurrentView = "HANA";
            this.setView(this);
        } else if (key === "ESPTab") {
            this.sCurrentView = "ESP";
            this.setView(this);
        } else if (key === "TestTab") {
            this._oTestDialog = sap.ui.xmlfragment("TestDialog", "sap.secmon.ui.performance.view.testDialog", this);
            this._oTestDialog.open();
        }
    },

    /*
     * @method Sets the Header of the Detail List @param {oGroup}
     */
    getGroupHeader : function(oGroup) {
        return new sap.m.GroupHeaderListItem({
            title : oGroup.key.slice(1),
            upperCase : false
        });
    },

    /*
     * @method calles when the Chart scope changed @param {oGroup}
     */
    onScopeChange : function(oEvt) {
        var scope = oEvt.getParameter('scope');
        var oPromise;

        if (scope === "HOUR" || scope === "DAY") {
            // SET VARS
            var oChart = oEvt.getSource(), startDate = oEvt.getParameter('startDate'), endDate = oEvt.getParameter('endDate');

            endDate = new Date(endDate.getTime() + 60 * 60 * 1000);

            switch (this.sCurrentView) {
            case "HANA":
                oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
                    "operation" : "getTestResultsByTime_new",
                    "startDate" : startDate,
                    "endDate" : endDate,
                    "unit" : 'HOUR',
                    "period" : (scope === "HOUR") ? 1 : 2
                }));
                break;
            case "ESP":
                oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
                    "operation" : "getESPResultsByTime_new",
                    "startDate" : startDate,
                    "endDate" : endDate,
                    "unit" : 'HOUR',
                    "period" : (scope === "HOUR") ? 1 : 2
                }));
                break;
            }

            oPromise.success(function(data) {
                if (data !== null) {
                    oChart.setScopeData(data);
                }
            });

        }
    },

    onCloseDialog : function() {
        this._oTestDialog.close();
        this._oTestDialog.destroy();
    },

    /*
     * @method Switch Datamodels of the Controls between HANA and ESP View @param {oController} @param {String} "HANA"/"ESP"
     */
    setView : function(that) {
        that.getView().byId("idChartPanel").setHeaderText(oTextBundle.getText("PE_ChartTitel_" + this.sCurrentView));
        that.getView().byId("idDetailList").setModel(that[this.sCurrentView + "_Details"]);
        that.getView().byId("idChart").setModel(that[this.sCurrentView + "_Chart"]);
    },

    onDeleteTestEvents : function(oEvt) {
        new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "deleteTestLogs"
        }));
    },

    onDeleteTestResults : function(oEvt) {
        new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "deleteTestResults"
        }));
    },

    /*
     * @method load Data from Databse @param {oController}
     */
    loadData : function(that) {
        // GET HANA DETAILS
        var oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getSystemOverview"
        }));
        oPromise.success(function(data) {
            if (data !== null) {
                data.details.push({
                    category : "0Chart Legend"
                });
                that.HANADetails = new sap.ui.model.json.JSONModel(data);
                that.getView().byId("idDetailList").setModel(that.HANADetails);
            }
        });

        // GET ESP DETAILS
        oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getSystemOverviewEsp_new"
        }));

        oPromise.success(function(data) {
            if (data !== null) {
                data.details.push({
                    category : "0Chart Legend"
                });
                that.ESPDetails = new sap.ui.model.json.JSONModel(data);
            }
        });

        // GET HANA CHART
        oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getTestResultsByTime_new"
        }));
        oPromise.success(function(data) {
            if (data !== null) {
                that.HANAChart = new sap.ui.model.json.JSONModel(data);
                that.getView().byId("idChart").setModel(that.HANAChart);
            } else {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidStorage"));
            }
        });

        // GET ESP CHART
        oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getESPResultsByTime_new"
        }));
        oPromise.success(function(data) {
            if (data !== null) {
                that.ESPChart = new sap.ui.model.json.JSONModel(data);
            } else {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidStorage"));
            }
        });

        oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getConfig"
        }));

        oPromise.success(function(data) {
            if (data !== null) {
                if (data.SendData === "true") {
                    that.getView().byId("idTestTab").setIconColor('Positive');
                } else {
                    that.getView().byId("idTestTab").setIconColor('Negative');
                    that.getView().byId("idTestTab").setEnabled(false);
                }
            } else {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidThroughput"));
            }
        });

    }

});
