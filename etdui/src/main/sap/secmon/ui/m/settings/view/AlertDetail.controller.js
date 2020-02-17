jQuery.sap.require("sap.secmon.ui.m.settings.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.settings.view.AlertDetail", {

    CHANGE_SERVICE_URL : "/sap/secmon/services/configuration/ConfigurationParameters.xsjs",

    uiModel : new sap.ui.model.json.JSONModel(),

    constructor : function() {
        sap.ui.core.mvc.Controller.apply(this, arguments);
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf etdui.App
     */
    onInit : function() {

        sap.ui.core.UIComponent.getRouterFor(this).attachRoutePatternMatched(this.handleRoute, this);
        this.getView().setModel(this.uiModel);
        // this.loadData();
    },

    handleRoute : function(oEvent) {

        var routeName = oEvent.getParameter("name");
        if (routeName !== 'manageAlerts') {
            return;
        }

        this.loadData();
    },

    onBackButtonPressed : function() {
        window.history.go(-1);
    },

    /**
     * load data from server and convert into format suitable for binding to UI controls
     */
    loadData : function() {
        var that = this;
        var oModel = this.getComponent().getModel("ConfigurationParameters");
        oModel.read("/ConfigurationParameters", {
            success : function(oData) {
                var uiData = {
                    SendAlertsToHttpDestination : false,
                    SendAlertMailNotifications : false,
                    SendAlertsIncludeTriggeringEvents : false,
                    BaseUrl : '',
                    Host : '',
                    TimeZoneInOlsonFormat : '',
                    SendAlertMinSeverity : 'LOW',
                    SendAlertMailSenderAddress : '',
                    SendAlertsFormat : 'json',
                    SendAlertsPatternFilter : ''
                };
                oData.results.forEach(function(row) {
                    if (row.Name in uiData) {
                        if (row.Name === 'SendAlertsToHttpDestination' || row.Name === 'SendAlertMailNotifications' || row.Name === 'SendAlertsIncludeTriggeringEvents') {
                            uiData[row.Name] = sap.secmon.ui.m.settings.util.Formatter.formatBooleanString(row.ValueVarChar);
                        } else {
                            uiData[row.Name] = row.ValueVarChar;
                        }
                    }
                });
                if (!uiData.BaseUrl || uiData.BaseUrl.length === 0) {
                    // Suggest a default value: Suggest base URL of the settings UI.
                    // It should be okay unless there's a proxy with weird routings
                    var location = document.location;
                    // careful: protocol ends with colon, e.g. "http:"
                    uiData.BaseUrl = location.protocol + "//" + location.host;
                }
                that.uiModel.setData(uiData);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                jQuery.sap.require("sap.m.MessageBox");
                sap.m.MessageBox.alert(that.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });
            }
        });
    },

    onSave : function(oEvent) {

        var oData = this.uiModel.getData();

        this.resetValueStateOfControls();
        if (!this.validateControls()) {
            return;
        }

        // update
        this.showBusyIndicator();
        for ( var attr in oData) {
            if (attr === 'SendAlertsToHttpDestination' || attr === 'SendAlertMailNotifications' || attr === 'SendAlertsIncludeTriggeringEvents') {
                oData[attr] = sap.secmon.ui.m.settings.util.Formatter.formatBooleanToString(oData[attr]);
            }
        }
        if (oData.BaseUrl) {
            oData.Host = sap.secmon.ui.m.settings.util.Formatter.getHostFromUrl(oData.BaseUrl);
        }

        var csrfToken = this.getComponent().getCsrfToken();
        var controller = this;
        $.ajax({
            type : "POST",
            url : this.CHANGE_SERVICE_URL,
            data : JSON.stringify(oData),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            success : function() {
                sap.m.MessageToast.show(controller.getText("MngAl_Saved_MSG"));
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                jQuery.sap.require("sap.m.MessageBox");
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });
            },
            complete : function() {
                controller.hideBusyIndicator();
                controller.loadData();
            }
        });
    },

    showBusyIndicator : function() {
        this.getView().byId("AlertDetailPage").setBusy(true);
    },

    hideBusyIndicator : function() {
        this.getView().byId("AlertDetailPage").setBusy(false);
    },

    /**
     * validate controls
     * 
     * @param oData
     *            bound data of model
     * @return true if validation passed
     */
    validateControls : function() {
        var passed = true;
        var oData = this.uiModel.getData();
        if (this.validateUrl() === false) {
            var panelId = oData.SendAlertMailNotifications === true ? "mailPanel" : "restPanel";
            var panel = this.getView().byId(panelId);
            panel.setExpanded(true);
            passed = false;
        }
        if (this.validateTimezone() === false) {
            var restPanel = this.getView().byId("restPanel");
            restPanel.setExpanded(true);
            passed = false;
        }
        if (this.validateEmail() === false) {
            var mailPanel = this.getView().byId("mailPanel");
            mailPanel.setExpanded(true);
            passed = false;
        }

        return passed;
    },

    validateUrl : function() {
        var oData = this.uiModel.getData();
        var oInput = this.getView().byId("baseURL");
        if (oData.SendAlertsToHttpDestination === true || oData.SendAlertMailNotifications === true) {
            var url = oInput.getValue();
            var regex = /^(http(?:s)?\:\/\/[a-zA-Z0-9]+(?:(?:\.|\-)[a-zA-Z0-9]+)+(?:\:\d+)?(?:\/[\w\-]+)*(?:\/?|\/\w+\.[a-zA-Z]{2,4}(?:\?[\w]+\=[\w\-]+)?)?(?:\&[\w]+\=[\w\-]+)*)$/;
            if (!url) {
                oInput.setValueState(sap.ui.core.ValueState.Error);
                return false;
            }
            var result = url.match(regex);
            if (!result || result.length === 0) {
                oInput.setValueState(sap.ui.core.ValueState.Error);
                return false;
            } else {
                oInput.setValueState(sap.ui.core.ValueState.None);
                return true;
            }
        } else {
            oInput.setValueState(sap.ui.core.ValueState.None);
        }
        return true;
    },

    validateEmail : function() {
        var oData = this.uiModel.getData();
        if (oData.SendAlertMailNotifications === true) {
            var oInput = this.getView().byId("senderAddress");
            var email = oInput.getValue();
            if (!email || email.indexOf('@') === -1 || email.length <= 3) {
                oInput.setValueState(sap.ui.core.ValueState.Error);
                return false;
            } else {
                oInput.setValueState(sap.ui.core.ValueState.None);
                return true;
            }
        }
        return true;
    },

    validateTimezone : function() {
        var oData = this.uiModel.getData();
        if (oData.SendAlertsFormat === 'syslogPackagedJson') {
            var oInput = this.getView().byId("timezone");
            var timezone = oInput.getValue();
            if (!timezone || timezone.length <= 2) {
                oInput.setValueState(sap.ui.core.ValueState.Error);
                return false;
            } else {
                oInput.setValueState(sap.ui.core.ValueState.None);
                return true;
            }
        }
        return true;
    },

    /**
     * reset controls, remove any error value state
     */
    resetValueStateOfControls : function() {
        var aInputs = [ this.getView().byId("baseURL"), this.getView().byId("senderAddress"), this.getView().byId("timezone") ];
        aInputs.forEach(function(oInput) {
            oInput.setValueState(sap.ui.core.ValueState.None);
        });
    },

    /**
     * cleanup
     */
    onExit : function() {

    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/e9485cafd5b841d6977752478b7ab9a5.html");
    },

});
