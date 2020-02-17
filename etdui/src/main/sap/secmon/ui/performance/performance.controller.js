/* globals oTextBundle */
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.ui.commons.MessageBox");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.performance.SystemViz");
jQuery.sap.require("sap.secmon.ui.performance.EspViz");

sap.ui.controller("sap.secmon.ui.performance.performance", {
    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    oModel : {},
    oModelEsp : {},
    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf v1
     */
    onInit : function() {
        var oController = this;
        this.oModel = sap.ui.getCore().getModel('PerfData');
        this.oModelEsp = sap.ui.getCore().getModel('EspData');

        var uName = this.oCommons.getSessionUser(this.oCommons.getXCSRFToken());
        var oAppHeader = sap.ui.getCore().byId("appHeader");
        oAppHeader.setUserName(uName);
        oAppHeader.setDisplayWelcome(true);
        oAppHeader.attachLogoff(null, function() {
            oController.logout();
        });

        var oInputControl = this.getView().byId("Input");
        var oLabelControl = sap.ui.getCore().byId("ThroughputState");

        var oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getConfig"
        }));

        oPromise.success(function(data) {
            if (data !== null) {
                oInputControl.setValue(data.Throughput);

                var state = oTextBundle.getText("PE_ThroughputLabel");
                if (data.SendData === "true") {
                    state += " (active)";
                } else {
                    state += " (inactive)";
                }
                oLabelControl.setText(state);
            } else {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidThroughput"));
            }
        });

        var oLabelControlSystemOverview = sap.ui.getCore().byId("RessourceOverview");
        oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getSystemOverviewHana"
        }));
        oPromise.success(function(data) {
            if (data !== null) {
                oLabelControlSystemOverview.setText(data);
                // oLabelControlSystemOverview.setText('SID: ' + data.SID + ' |
                // RAM: ' + data.RAM + ' | CPU: ' + data.CPU);
            } else {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidOverview"));
            }
        });

        var oLabelControlSystemOverviewEsp = sap.ui.getCore().byId("RessourceOverviewEsp");
        oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getSystemOverviewEsp"
        }));
        oPromise.success(function(data) {
            if (data !== null) {
                oLabelControlSystemOverviewEsp.setText(data);
            } else {
                oLabelControlSystemOverviewEsp.setText("");
            }
        });

        var oInputControlStorage = this.getView().byId("InputStorage");
        oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getPartRetention"
        }));

        oPromise.success(function(data) {
            if (data !== null) {
                oInputControlStorage.setValue(data);
            } else {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidStorage"));
            }
        });

        oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getTestResultsByTime"
        }));
        oPromise.success(function(data) {
            if (data !== null) {

                var mod = sap.ui.getCore().getModel('PerfData');
                mod.setData(data);
                mod.refresh(true);
            } else {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidStorage"));
            }
        });

        oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
            "operation" : "getESPResultsByTime"
        }));
        oPromise.success(function(data) {
            if (data !== null) {

                var modEsp = sap.ui.getCore().getModel('EspData');
                modEsp.setData(data);
                modEsp.refresh(true);
            } else {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidStorage"));
            }
        });

    },

    onSelectData : function(oEvent) {
        var aFilters = [];
        aFilters = oEvent.getParameter("filters").data;
        var mod;
        if (oEvent.getSource().sId === "espViz") {
            mod = sap.ui.getCore().getModel('EspData');
        } else {
            mod = sap.ui.getCore().getModel('PerfData');
        }

        var dataLength = mod.oData.length;
        var entry = {};
        for (var i = 0; i < oEvent.getParameter("filters").length; i++) {
            entry = oEvent.getParameter("filters")[i].data.Timestamp;
            for (var j = 0; j < dataLength; j++) {
                if (mod.oData[j].Timestamp === entry) {
                    mod.oData.splice(j, 1);
                    j--;
                    dataLength--;
                }
            }
        }
        mod.refresh(true);
    },

    logout : function() {
        $.ajax({
            url : "/sap/secmon/services/logout.xscfunc",
            type : "POST",
            headers : {
                "X-CSRF-Token" : this.oCommons.getXCSRFToken()
            },
            success : function(ret) {
                document.location.reload(true);
            }
        });
    },

    okPressed : function(oEvent) {
        var oPromise;
        if (oEvent.mParameters.id === "DeleteTestResults") {
            oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
                "operation" : "deleteTestResults"
            }));
        } else if (oEvent.mParameters.id === "DeleteTestLogs") {
            oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
                "operation" : "deleteTestLogs"
            }));
        } else if (oEvent.mParameters.id === "StorageButton") {
            var oInputControlStorage = this.getView().byId("InputStorage");
            var oStorage = oInputControlStorage.getValue();

            if (oStorage === "") {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_EnterStorage"));
            } else if (this.validateInput(oStorage)) {

                oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
                    "operation" : "setPartRetention",
                    "Retention" : oStorage
                }));

                oPromise.success(function(data) {
                    if (data === null) {
                        sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidStorage"));
                    }
                });
            } else {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidStorage"));
            }

        } else {
            var oInputControl = this.getView().byId("Input");
            var oThroughput = oInputControl.getValue();
            
            if (oThroughput === "") {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_EnterThroughput"));
            } else if (this.validateInput(oThroughput)) {

                oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/performance/perf.xsjs", JSON.stringify({
                    "operation" : "changeConfig",
                    "Throughput" : oThroughput,
                    "SendData" : oThroughput > 0 ? "true" : "false",
                    "ChangedBy" : this.oCommons.getSessionUser(this.oCommons.getXCSRFToken()),
                    "TestEnvSetup" : "false"
                }));

                oPromise.success(function(data) {
                    if (data !== null) {

                        var state = oTextBundle.getText("PE_ThroughputLabel");
                        if (oThroughput > 0) {
                            state += " (active)";
                        } else {
                            state += " (inactive)";
                        }
                        var oLabelControl = sap.ui.getCore().byId("ThroughputState");
                        oLabelControl.setText(state);

                    } else {
                        sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidThroughput"));
                    }
                });
            } else {
                sap.ui.commons.MessageBox.alert(oTextBundle.getText("PE_MSG_InvalidThroughput"));
            }

            oPromise.fail(function(jqXHR, textStatus, errorThrown) {
                sap.ui.getCore().byId("Shell").getNotificationBar().getMessageNotifier().addMessage(new sap.ui.core.Message({
                    text : jqXHR.responseText,
                    timestamp : new Date().toLocaleString(),
                    level : sap.ui.core.MessageType.Error
                }));
            });
        }

    },

    validateInput : function(input) {
        var regex = /^[0-9]{1,6}$/;
        if (input.match(regex)) {
            return true;
        } else {
            return false;
        }
    },

/**
 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered (NOT before the first rendering! onInit() is used for that one!).
 * 
 * @memberOf v1
 */
// onBeforeRendering: function() {
//
// },
/**
 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here. This hook is the same one that SAPUI5 controls get after
 * being rendered.
 * 
 * @memberOf v1
 */
// onAfterRendering: function() {
//
// },
/**
 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
 * 
 * @memberOf v1
 */
// onExit: function() {
//
// }
});