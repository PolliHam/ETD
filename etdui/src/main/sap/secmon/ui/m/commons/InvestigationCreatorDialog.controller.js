jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.invest.AttackRadioButtonHandler");

sap.ui.controller("sap.secmon.ui.m.commons.InvestigationCreatorDialog", {

    INVESTIGATION_SERVICE_URL : "/sap/secmon/services/ui/m/invest/Investigation.xsjs",
    INVESTIGATION_ASSIGNMENTS_SERVICE_URL : "/sap/secmon/services/ui/m/invest/InvestigationAssignment.xsjs",
    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    oDialog : null,
    oEditModel : null,
    aObjects : null,
    fnSuccessCallback : null,
    fnTokenProvider : null,
    /**
     * @memberOf sap.secmon.ui.m.commons.InvestigationCreatorDialog
     */
    onInit : function() {
    },

    openDialog : function(aAlerts, oParentView, fnSuccessCallback, fnTokenProvider, oDefaultValues) {
        var aObjects = aAlerts.map(function(oAlert) {
            return {
                ObjectType : 'ALERT',
                ObjectId : oAlert.AlertId,
                ObjectReadTimestamp : oAlert.AlertReadTimestamp,
                ObjectHashCode : oAlert.AlertHashCode
            };
        });
        this.openDialogEx(aObjects, oParentView, fnSuccessCallback, fnTokenProvider, oDefaultValues);
    },

    /*
     * Create an investigation and add objects.
     * 
     * oObjects: object containing the Objects to add to the investigation. Allowed Object Types are: "ALERT", "EVENT", "FSPACE" and "SNAPSHOT"
     * 
     * Example: [ { ObjectType : 'ALERT', ObjectId : 'ABCDABCD' }, { ObjectType : 'EVENT', ObjectId : 'DDDDABCD' } ]
     */
    openDialogEx : function(aObjects, oParentView, fnSuccessCallback, fnTokenProvider, oDefaultValues) {
        this.fnSuccessCallback = fnSuccessCallback;
        this.fnTokenProvider = fnTokenProvider;
        this.oParentView = oParentView;
        this.oDefaultValues = oDefaultValues;

        this.aObjects = aObjects;
        if (!this.oDialog) {
            var that = this;
            this.oDialog = sap.ui.xmlfragment(oParentView.getId(), "sap.secmon.ui.m.commons.InvestigationCreatorDialog", this);
            oParentView.addDependent(this.oDialog);
            // set own i18n model
            var i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl : "/sap/secmon/ui/m/commons/i18n/UIText.hdbtextbundle"
            });
            this.oDialog.setModel(i18nModel, "i18n");

            // set i18nCommon model
            if (this.oDialog.getModel("i18nCommon") === undefined) {
                var i18nModelCommon = new sap.ui.model.resource.ResourceModel({
                    bundleUrl : "/sap/secmon/ui/CommonUIText.hdbtextbundle"
                });
                this.oDialog.setModel(i18nModelCommon, "i18nCommon");
            }

            // set enums Model
            if (this.oDialog.getModel("enums") === undefined) {
                var oEnumService = new sap.secmon.ui.commons.EnumService();
                var oEnums = oEnumService.loadEnums("sap.secmon.services.ui.m");
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(oEnums);
                this.oDialog.setModel(oModel, "enums");
            }

            // set hanausers model
            if (this.oDialog.getModel("hanaUsers") === undefined) {
                var oHanaUsersPromise = this.createHanaUsersModelAsync();
                oHanaUsersPromise.done(function(oHanaUsersModel) {
                    that.oDialog.setModel(oHanaUsersModel, 'hanaUsers');

                });
            }
            var aInputs = [ oParentView.byId("description") ];
            this.oInputValidationService = new sap.secmon.ui.commons.InputValidationService(aInputs);
            this.enhanceDescriptionValidator(aInputs[0]);

        }
        this.oInputValidationService.resetValueStateOfControls();
        this.oEditModel = new sap.ui.model.json.JSONModel();
        var oData;
        if (this.oDefaultValues) {
            oData = this.oDefaultValues;
        } else {
            oData = {
                Severity : "MEDIUM",
                Processor : "",
                Status : "OPEN",
                ManagementVisibility : "NOT_NEEDED",
                Description : "",
                Attack : "",
                Comment : ""
            };
        }
        this.oEditModel.setData(oData);

        this.oDialog.setModel(this.oEditModel, "editModel");
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", oParentView, this.oDialog);
        this.oDialog.open();
    },

    createHanaUsersModelAsync : function() {
        var oDeferred = $.Deferred();
        var oCommons = this.oCommons;
        $.ajax({
            url : encodeURI("/sap/secmon/services/hanaUsers.xsodata/HanaUsers?$format=json"),
            async : true,
            type : "GET",
            success : function(data, textStatus, XMLHttpRequest) {
                var oModel = new sap.ui.model.json.JSONModel();
                // display up to 500 items instead of only 100
                oModel.setSizeLimit(500);
                oModel.setData({
                    HanaUsers : data.d.results
                });
                oDeferred.resolve(oModel);
            },
            error : function(xhr, textStatus, errorThrown) {
                oDeferred.reject();
                alert(oCommons.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
            }
        });
        return oDeferred.promise();
    },

    enhanceDescriptionValidator : function(oInput) {
        var oType = oInput.mBindingInfos.value.type;
        var fnValidator = oType.validateValue;
        oType.validateValue = function(value) {
            if (value !== null && value !== undefined) {
                value = value.trim();
            }
            fnValidator.call(this, value);
        };
    },

    afterOpen : function() {
        this.addSorterToHanaUsersSelect(this.oParentView.byId("ICDhanaUsers"));
    },

    addSorterToHanaUsersSelect : function(oSelect) {
        var oTemplate = new sap.ui.core.Item({
            text : "{hanaUsers>USER_NAME}",
            key : "{hanaUsers>USER_NAME}"
        });
        oSelect.bindAggregation("items", "hanaUsers>/HanaUsers", oTemplate, new sap.ui.model.Sorter("USER_NAME", false));
    },

    onOk : function(oEvent) {
        if (!this.oInputValidationService.checkControls()) {
            return;
        }
        this.createInvestigation();
    },

    onOkAndOpen : function(oEvent) {
        if (!this.oInputValidationService.checkControls()) {
            return;
        }
        this.createInvestigation(true);

    },

    onCancel : function(oEvent) {
        this.oDialog.close();
    },

    createInvestigation : function(bNavigateToInvestigation) {
        var oData = this.oEditModel.getData();
        var oInvestigation = {
            Severity : oData.Severity,
            Processor : oData.Processor,
            Status : oData.Status,
            Attack : oData.Attack,
            ManagementVisibility : oData.ManagementVisibility,
            Description : oData.Description,
            Objects : this.aObjects
        };
        if (oData.Comment !== "") {
            oInvestigation.Attachments = [ {
                Type : "COMMENT",
                Content : oData.Comment.trim()
            } ];
        }
        var controller = this;
        var sToken;
        if (this.fnTokenProvider !== null && this.fnTokenProvider !== undefined) {
            sToken = this.fnTokenProvider();
        } else {
            sToken = this.getComponentOfParent().getCsrfToken();
        }
        var fnError = function(XMLHttpRequest, textStatus, errorThrown) {
            sap.ui.core.BusyIndicator.hide();
            var sText = XMLHttpRequest.responseText;
            sap.m.MessageBox.alert(sText, {
                title : controller.getText("MInvest_CreateInvFailed")
            });

        };
        sap.ui.core.BusyIndicator.show(0);
        $.ajax({
            type : "POST",
            url : this.INVESTIGATION_SERVICE_URL,
            data : JSON.stringify(oInvestigation),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", sToken);
            },
            success : function(data) {
                sap.ui.core.BusyIndicator.hide();
                controller.completeCreation(data, bNavigateToInvestigation);

            },
            error : fnError
        });
    },

    completeCreation : function(oReturnData, bNavigateToInvestigation) {
        if (oReturnData.sqlErrorCode && oReturnData.sqlErrorCode > 0) {
            // 131: ERR_TX_ROLLBACK_LOCK_TIMEOUT -- transaction rolled back by lock wait timeout
            // 133: ERR_TX_ROLLBACK_DEADLOCK -- transaction rolled back by detected deadlock
            // 146: ERR_TX_LOCK_ACQUISITION_FAIL -- Alert table rows locked (only if option NOWAIT is specified)

            sap.m.MessageBox.alert(this.getText("MInvest_alertLocked"), {
                title : this.getText("MInvest_notStarted")
            });
        } else if (oReturnData && oReturnData.rejectedObjects && oReturnData.rejectedObjects.length > 0) {
            var rejectedObjectCount = oReturnData.rejectedObjects.length;
            var totalCount = this.aObjects ? this.aObjects.length : 0;

            if (totalCount > 0) {
                if (totalCount === rejectedObjectCount) {
                    if (totalCount === 1) {
                        sap.m.MessageBox.alert(this.getText("MInvest_alertChgDetect"), {
                            title : this.getText("MInvest_notStarted")
                        });
                    } else {
                        sap.m.MessageBox.alert(this.getText("MInvest_allAlrtsChgDetect", totalCount), {
                            title : this.getText("MInvest_notStarted")
                        });
                    }
                } else {
                    var rejectedLinks = oReturnData.rejectedObjects.map(function(oObject) {
                        return {
                            Text : oObject.ObjectName,
                            Url : sap.secmon.ui.m.commons.NavigationService.alertURL(oObject.ObjectId, "Comments")
                        };
                    });
                    var acceptedCount = totalCount - rejectedObjectCount;

                    var oView = this.oDialog;
                    if (!oView.getModel("messages")) {
                        var oModel = new sap.ui.model.json.JSONModel();
                        oView.setModel(oModel, "messages");
                    }
                    var messagesData = {
                        acceptedCount : acceptedCount,
                        totalCount : totalCount,
                        rejectedCount : rejectedObjectCount,
                        investigationNumber : oReturnData.investigationNumber,
                        rejectedLinks : rejectedLinks
                    };
                    oView.getModel("messages").setData(messagesData);

                    if (!this._alertsChangedMessageLayout) {
                        this._alertsChangedMessageLayout = sap.ui.xmlfragment("sap.secmon.ui.m.commons.AlertsChangedMessage", this);
                        oView.addDependent(this._alertsChangedMessageLayout);
                    }

                    sap.m.MessageBox.show(this._alertsChangedMessageLayout, {
                        title : this.getText("MInvest_chgDetect"),
                        onClose : function(oAction) {
                            if (bNavigateToInvestigation) {
                                sap.secmon.ui.m.commons.NavigationService.navigateToInvestigation(oReturnData.Id);
                            }
                        }
                    });
                }
            }
        } else {
            if (bNavigateToInvestigation) {
                sap.secmon.ui.m.commons.NavigationService.navigateToInvestigation(oReturnData.Id);
            }
        }

        this.fnSuccessCallback(oReturnData);
        this.oDialog.close();
    },

    /**
     * Returns the text value with the given text key from the i18n model.
     */
    getText : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), resource = this.oDialog.getModel("i18n").getResourceBundle();
        return resource.getText.apply(resource, parameters);
    },
    /**
     * Returns the text value with the given text key from the i18n common model.
     */
    getCommonText : function(sTextKey) {
        return this.oDialog.getModel("i18nCommon").getProperty(sTextKey);
    },

    getComponentOfParent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.oParentView));
    },

    onAssignMyselfAsProcessor : function(oEvent) {
        var applContextModel = this.oDialog.getModel("applicationContext");
        var logonUser = applContextModel.getData().userName;
        var data = this.oEditModel.getData();
        data.Processor = logonUser;
        this.oEditModel.setData(data);
    }

});
