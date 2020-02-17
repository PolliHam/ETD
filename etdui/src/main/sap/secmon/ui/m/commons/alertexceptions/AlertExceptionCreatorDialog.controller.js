jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.RequestUtils");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");

sap.ui.controller("sap.secmon.ui.m.commons.alertexceptions.AlertExceptionCreatorDialog", {

    ALERT_EXCEPTION_SERVICE_URL : "/sap/secmon/services/ui/m/alertexceptions/AlertException.xsjs",
    ONE_DAY_IN_MILLISECONDS : 24 * 60 * 60 * 1000,
    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    oRequestUtils : new sap.secmon.ui.m.commons.RequestUtils(),

    oDialog : null,
    oAlertExceptionModel : null,

    onInit : function() {
    },

    UTC : function() {
        return this.getComponent().getModel("applicationContext").getData().UTC;
    },

    openDialog : function(sPatternId, sAlertId, oParentView, fnSuccessCallback) {
        this.oParentView = oParentView;
        this.fnSuccessCallback = fnSuccessCallback;

        this.sPatternId = sPatternId;
        this.sAlertId = sAlertId;
        if (!this.oDialog) {
            this.sDialogId = this.oParentView.createId("AlertExceptionCreatorDialog");
            this.oDialog = sap.ui.xmlfragment(this.sDialogId, "sap.secmon.ui.m.commons.alertexceptions.AlertExceptionCreatorDialog", this);
            oParentView.addDependent(this.oDialog);
            // set own i18n model
            var i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl : "/sap/secmon/ui/m/commons/alertexceptions/i18n/UIText.hdbtextbundle"
            });
            this.oDialog.setModel(i18nModel, "i18n");
        }
        this.oAlertExceptionModel = new sap.ui.model.json.JSONModel({});
        this.oDialog.setModel(this.oAlertExceptionModel, "alertException");
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        this.oDialog.open();
        this.readPatternGroupingAttributes();
        this.setupInputValidation();
    },

    setupInputValidation : function() {
        var aInputs = [ this.byId("descriptionInput") ];
        this.oInputValidationService = new sap.secmon.ui.commons.InputValidationService(aInputs);
        this.oInputValidationService.resetValueStateOfControls();
    },

    byId : function(sId) {
        return sap.ui.core.Fragment.byId(this.sDialogId, sId);
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.oParentView));
    },

    readPatternGroupingAttributes : function() {
        this.oDialog.setBusy(true);
        var that = this;
        var sUrl = "/sap/secmon/services/ui/m/alertexceptions/PatternGroupingAttributes.xsjs?";
        if (this.sAlertId !== undefined && this.sAlertId !== null) {
            sUrl += "alertId=" + this.sAlertId;
        } else {
            sUrl += "patternId=" + this.sPatternId;
        }
        $.ajax({
            url : sUrl,
            type : "GET",
            success : function(oData) {
                that.oDialog.setBusy(false);
                that.buildAlertExceptionModel(oData);
            },
            error : function(request, status, error) {
                that.oDialog.setBusy(false);
            }
        });
    },

    buildAlertExceptionModel : function(oData) {
        var oValidFrom = new Date();
        var oValidTo = new Date(oValidFrom.getTime() + this.ONE_DAY_IN_MILLISECONDS);
        var aAllowedAttributes = oData.GroupingAttributes.filter(function(oAttribute) {
            return oAttribute.ValueType === 'ValueVarChar' || oAttribute.ValueType === 'ValueInteger' || oAttribute.ValueType === 'ValueBigInt';
        });
        var aAttributes = aAllowedAttributes.map(function(oAttribute) {
            return {
                AttributeKey : oAttribute.AttributeKey,
                Name : oAttribute.Name,
                Value : oAttribute.Value !== undefined ? oAttribute.Value : null,
                ValueType : oAttribute.ValueType,
                IsEnum : oAttribute.IsEnum,
                EnumValues : oAttribute.EnumValues,
            };
        });
        if (this.UTC()) {
            oValidFrom = this.oCommons.adjustDateForInputInUTC(oValidFrom);
            oValidTo = this.oCommons.adjustDateForInputInUTC(oValidTo);
        }
        this.oAlertExceptionModel.setData({
            PatternName : oData.PatternName,
            Description : "",
            PatternId : oData.PatternId,
            Details : aAttributes,
            ValidFrom : oValidFrom,
            ValidTo : oValidTo
        });
    },

    onOk : function(oEvent) {
        var oValidFromDateControl = this.byId("validFromDate");
        var oValidToDateControl = this.byId("validToDate");
        if (oValidToDateControl.getDateValue().getTime() <= oValidFromDateControl.getDateValue().getTime()) {
            oValidFromDateControl.setValueState(sap.ui.core.ValueState.Error);
            oValidToDateControl.setValueState(sap.ui.core.ValueState.Error);
            return;
        }
        oValidFromDateControl.setValueState(sap.ui.core.ValueState.None);
        oValidToDateControl.setValueState(sap.ui.core.ValueState.None);
        if (!this.oInputValidationService.checkControls()) {
            return;
        }        
        this.createAlertException();
    },

    onCancel : function(oEvent) {
        this.oDialog.close();
    },

    createAlertException : function() {
        var oAlertExcemption = this.oAlertExceptionModel.getData();
        if (this.UTC()) {
            oAlertExcemption.ValidFrom = this.oCommons.adjustTimeInputToUTC(oAlertExcemption.ValidFrom);
            oAlertExcemption.ValidTo = this.oCommons.adjustTimeInputToUTC(oAlertExcemption.ValidTo);
        }
        this.sendRequestAndCloseDialog(oAlertExcemption);
    },

    getText : function(sKey) {
        return this.oDialog.getModel("i18n").getProperty(sKey);
    },

    getComponentOfParent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.oParentView));
    },

    sendRequestAndCloseDialog : function(objectToSendAsJSON) {
        var that = this;
        var csrfToken = this.getComponent().getCsrfToken();
        this.oRequestUtils.postRequest(this.ALERT_EXCEPTION_SERVICE_URL, objectToSendAsJSON, csrfToken, function() {
            that.oDialog.close();
            sap.m.MessageToast.show(that.getText("MAEx_createdExemption"));
            var cb = that.fnSuccessCallback;
            if (cb !== undefined && cb !== null) {
                cb();
            }
        });
    },

    getAlertExceptionsTable : function() {
        return this.byId("alertExceptionsTable");
    },

    updateValue : function(index, newValue) {
        var oAlertException = this.oAlertExceptionModel.getData();
        oAlertException.Details[index].Value = newValue;
        this.oAlertExceptionModel.refresh();
    },

    deleteRow : function(index) {
        var oAlertException = this.oAlertExceptionModel.getData();
        oAlertException.Details.splice(index, 1);
        this.oAlertExceptionModel.refresh();
    },

    openEditValueDialog : function(oValueInfo, index) {
        if (!this.oController) {
            this.oController = sap.ui.controller("sap.secmon.ui.m.commons.dialogs.EditValueDialog");
        }
        var that = this;
        this.oController.openDialog(this.oParentView, oValueInfo, function(newValue) {
            that.updateValue(index, newValue);
        });
    },

    getLineIndex : function(oItemControlEvent) {
        var oTableLine = oItemControlEvent.getSource().getParent();
        var index = this.getAlertExceptionsTable().indexOfItem(oTableLine);
        return index;
    },

    onEditValue : function(oEvent) {
        var ctx = oEvent.getSource().getBindingContext('alertException');
        var index = this.getLineIndex(oEvent);
        var oValueInfo = {
            Id : ctx.getProperty("Name"),
            Name : ctx.getProperty("Name"),
            ValueType : ctx.getProperty("ValueType"),
            IsEnum : ctx.getProperty("IsEnum"),
            EnumValues : ctx.getProperty("EnumValues"),
            Value : ctx.getProperty("Value"),
        };
        this.openEditValueDialog(oValueInfo, index);
    },

    onDelete : function(oEvent) {
        var index = this.getLineIndex(oEvent);
        this.deleteRow(index);
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/1ad487e0ef264b739ee5f2a52ffa047e.html");
    }

});
