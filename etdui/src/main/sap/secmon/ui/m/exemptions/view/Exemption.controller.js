jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.exemptions.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.exemptions.view.Exemption", {

    EXCEPTION_SERVICE : "/sap/secmon/services/ui/m/alertexceptions/AlertException.xsodata/",
    XSJS_PATTERN_GROUPING : "/sap/secmon/services/ui/m/alertexceptions/PatternGroupingAttributes.xsjs",
    EXCEPTION_UPDATE_SERVICE : "/sap/secmon/services/ui/m/alertexceptions/AlertException.xsjs/",
    requestCompletedAttached : false,

    onInit : function() {
        this.createEditModel();
        this.createExemptionDetailsForms();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.applyCozyCompact();

        this.getComponent().getNavigationVetoCollector().register(function() {
            if (this.editModel.oData.displayMode) {
                return true;
            } else {
                var oDeferred = $.Deferred();

                this.handleCancel(function() {
                    oDeferred.resolve();
                }, function() {
                    oDeferred.reject();
                });

                return oDeferred.promise();
            }
        }, this);
        this.UTC = this.getComponent().getModel("applicationContext").getData().UTC;
    },

    bindExemption : function(oModel, sExemptionId) {

        this.oModel = oModel;
        this.getView().setModel(oModel);
        // reset previous binding context
        this.getView().unbindElement();
        // update binding context
        this.exemptionId = sExemptionId;
        var sPath = "/AlertException('" + this.exemptionId + "')?$expand=AlertExceptionDetail";
        this.getView().bindElement(sPath);

    },


    createExemptionDetailsForms : function() {
        if (!this.editDetailsForm) {
            this.editDetailsForm = sap.ui.xmlfragment(this.getView().createId("EditForm"), "sap.secmon.ui.m.exemptions.view.ExemptionEditForm", this);
        }

        this.displayDetailsForm = sap.ui.xmlfragment(this.getView().createId("DisplayForm"), "sap.secmon.ui.m.exemptions.view.ExemptionDisplayForm", this);
        this.oExemptionDetailsContainer = this.getView().byId("exemptionDetailsContainer");
        this.oExemptionDetailsContainer.insertContent(this.displayDetailsForm, 0);

        var aInputs = [ sap.ui.core.Fragment.byId(this.getView().createId("EditForm"), "ReasonInput") ];
        this.oInputValidationService = new sap.secmon.ui.commons.InputValidationService(aInputs);

    },

    createEditModel : function() {
        this.editModel = new sap.ui.model.json.JSONModel();
        this.editModel.setData({
            editMode : false,
            displayMode : true,
        });
        this.getView().setModel(this.editModel, "editModel");
    },

    isEditMode : function() {
        return this.editModel.getData().editMode;
    },

    onEditExemption : function(oEvent) {
        this.setEditMode(true);
    },

    setEditMode : function(bEditMode) {

        this.oInputValidationService.resetValueStateOfControls();
        var model = this.getView().getModel();

        this.EditMode = bEditMode;
        function handleRequestCompleted() {
            if (this.EditMode) {
                var oContext = this.oExemptionDetailsContainer.getBindingContext();
                var oData = this.getView().getModel().oData;
                var aDetailPath = oContext.getProperty("AlertExceptionDetail");
                var aDimensions = aDetailPath.map(function(sPath) {
                    return {
                        Name : oData[sPath].Name,
                        AttributeKey : oData[sPath].AttributeKey,
                        ValueLow : oData[sPath].ValueLow,
                        ValueTypeLow : oData[sPath].ValueTypeLow,
                        Id : oData[sPath].Id,
                        DisplayKey : oData[sPath].DisplayKey
                    };
                });

                var oValidFrom = oContext.getProperty("ValidFrom");
                var oValidTo = oContext.getProperty("ValidTo");
                if (this.UTC) {
                    oValidFrom = this.oCommons.adjustDateForInputInUTC(oValidFrom);
                    oValidTo = this.oCommons.adjustDateForInputInUTC(oValidTo);
                }

                this.editModel.setData({
                    editMode : true,
                    displayMode : false,
                    ExceptionDescription : oContext.getProperty("ExceptionDescription"),
                    ValidFrom : oValidFrom,
                    ValidTo : oValidTo,
                    Details : aDimensions
                });

                var oTable = sap.ui.core.Fragment.byId(this.getView().createId("EditForm"), "exemptionDetails");
                oTable.removeSelections();

                this.oInitialEditModelData = this.oCommons.cloneObjectIncludingUndefinedAttributes(this.editModel.getData());

            } else {
                this.editModel.setData({
                    editMode : false,
                    displayMode : true,
                });
            }
            this.oExemptionDetailsContainer.removeContent(0);
            if (this.EditMode) {
                this.oExemptionDetailsContainer.insertContent(this.editDetailsForm, 0);

            } else {
                this.oExemptionDetailsContainer.insertContent(this.displayDetailsForm, 0);
            }

        }

        if (this.EditMode) {
            var oContext = this.oExemptionDetailsContainer.getBindingContext();
            var that = this;
            var url = this.XSJS_PATTERN_GROUPING + "?patternId=" + oContext.getProperty("Id");
            $.ajax({
                type : "GET",
                url : url,
                async : false,
                contentType : "application/json; charset=UTF-8",
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", that.csrfToken);
                },
                error : function(XMLHttpRequest, textStatus, errorThrown) {
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.alert(that.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                        title : that.getView().getModel("i18nCommon").getProperty("Error_TIT")
                    });

                },
                success : function(oData) {
                    var aDetails = [];
                    oData.GroupingAttributes.forEach(function(oDetail) {
                        // currently only ValueVarChar, ValueInteger and
                        // ValueBigInt are supported
                        if (oDetail.ValueType === "ValueVarChar" || oDetail.ValueType === "ValueInteger" || oDetail.ValueType === "ValueBigInt") {
                            aDetails.push(oDetail);
                        }
                    });
                    that.Details = aDetails;
                },
            });
        }

        // ensure that the data is loaded new from db and then displayed
        if (this.requestCompletedAttached === false) {
            // this workaround is needed because detachRequestCompleted doesn't
            // seem to work
            model.attachRequestCompleted(handleRequestCompleted, this);
            this.requestCompletedAttached = true;

            sap.ui.core.Fragment.byId(this.getView().createId("EditForm"), "exemptionDetails").attachUpdateFinished(function(oEvent) {

                // Reset buttons by firing selection change events
                if (this.getParent().getModel("editModel") && this.getParent().getModel("editModel").getData().editMode === true) {
                    if (this.getItems().length === this.getParent().getParent().getParent().getController().Details.length) {
                        sap.ui.core.Fragment.byId(this.getParent().getParent().getParent().createId("EditForm"), "addButton").setEnabled(false);
                    } else {
                        sap.ui.core.Fragment.byId(this.getParent().getParent().getParent().createId("EditForm"), "addButton").setEnabled(true);
                    }
                    if (this.getItems().length === 0) {
                        sap.ui.core.Fragment.byId(this.getParent().getParent().getParent().createId("EditForm"), "deleteButton").setEnabled(false);
                    } else {
                        sap.ui.core.Fragment.byId(this.getParent().getParent().getParent().createId("EditForm"), "deleteButton").setEnabled(true);
                    }
                }
            });

        }
        model.refresh();
    },

    onCancelExemption : function() {
        this.handleCancel();
    },

    sendRequestAndUpdateModel : function(requestType, url, objectToSendAsJSON) {
        var csrfToken = this.getComponent().getCsrfToken();
        var controller = this;
        $.ajax({
            type : requestType,
            url : url,
            data : JSON.stringify(objectToSendAsJSON),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            success : function(data) {
                controller.getView().getModel().refresh(false);
                controller.setEditMode(false);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(XMLHttpRequest.responseText, {
                    title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });

            }
        });
    },
    sendDeletionRequestAndUpdateModel : function(requestType, url, objectToSendAsJSON) {
        objectToSendAsJSON.PatternId = objectToSendAsJSON.Id;
        var csrfToken = this.getComponent().getCsrfToken();
        var that = this;
        $.ajax({
            type : requestType,
            url : url,
            data : JSON.stringify(objectToSendAsJSON),
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            success : function() {
                that.getView().getModel("exemptions").refresh(false);
                sap.m.MessageToast.show(sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/exemptions/i18n/UIText.hdbtextbundle", "Delete_Success"));
                that.onNavBack();
            },

            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(XMLHttpRequest.responseText, {
                    title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });

            }
        });
    },

    onSaveExemption : function() {
        if (!this.oInputValidationService.checkControls()) {
            return;
        }
        var that = this;
        var bindingContext = that.getView().getBindingContext();
        var bindingObject;
        if (bindingContext) {
            bindingObject = bindingContext.getObject();
        }
        var oData = this.editModel.getData();

        var aDetails = oData.Details.map(function(oDetail) {
            return {
                AttributeKey : oDetail.AttributeKey,
                Value : oDetail.ValueLow,
                ValueType : oDetail.ValueTypeLow,
                Id : oDetail.Id
            };

        });

        var oValidFrom = oData.ValidFrom;
        var oValidTo = oData.ValidTo;

        if (this.UTC) {
            oValidFrom = this.oCommons.adjustTimeInputToUTC(oValidFrom);
            oValidTo = this.oCommons.adjustTimeInputToUTC(oValidTo);
        }

        // only the changeable data are set
        var oExemption = {
            Id : bindingObject.ExceptionId,
            Description : oData.ExceptionDescription,
            ValidFrom : oValidFrom,
            ValidTo : oValidTo,
            Details : aDetails
        };
        this.sendRequestAndUpdateModel("PUT", this.EXCEPTION_UPDATE_SERVICE, oExemption);

    },

    onDeleteExemption : function() {

        var that = this;
        var bindingContext = that.getView().getBindingContext();
        var aExceptionIds = [];
        if (bindingContext) {
            aExceptionIds.push(bindingContext.getObject().ExceptionId);
        }
        var confirmationText = sap.secmon.ui.commons.Formatter.i18nText(this.getText("Delete_Confirm"));
        sap.m.MessageBox.confirm(confirmationText, {
            title : this.getCommonText("Delete_TIT"),
            icon : sap.m.MessageBox.Icon.WARNING,
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.DELETE) {

                    that.sendDeletionRequestAndUpdateModel("DELETE", that.EXCEPTION_UPDATE_SERVICE, aExceptionIds);
                }
            }
        });

    },

    onDeleteDimension : function(oEvent) {
        var oTable = sap.ui.core.Fragment.byId(this.getView().createId("EditForm"), "exemptionDetails");
        var aIds = [];
        var aContexts = oTable.getSelectedContexts();
        aContexts.forEach(function(oContext) {
            aIds.push(oContext.getProperty("Id"));
        });
        var oModelData;

        oModelData = this.editModel.getData();
        aIds.forEach(function(id) {
            oModelData.Details = oModelData.Details.filter(function(oDimension) {
                if (id === oDimension.Id) {
                    return false;
                } else {
                    return true;
                }
            });
        });

        oTable.removeSelections();
        this.editModel.setData(oModelData);
    },

    onAddDimension : function(oEvent) {
        var that = this;
        var oExemption = this.getView().getBindingContext().getObject();
        // call dialog
        if (!this.oAddDimensionController) {
            this.oAddDimensionController = sap.ui.controller("sap.secmon.ui.m.exemptions.view.AddDimensionDialog");
        }
        this.oAddDimensionController.openDialog(oExemption, that.getView(), function() {
        });
        var valueInput = this.getView().byId("valueInput");
        valueInput.focus();

    },

    handleCancel : function(fnActionAfterCancel, fnActionOnNoCancellation) {
        if (this.oCommons.deepEqual(this.editModel.getData(), this.oInitialEditModelData)) {
            this.setEditMode(false);
            if (fnActionAfterCancel) {
                fnActionAfterCancel();
            }
            return;
        }
        var that = this;
        var title = this.getView().getModel("i18nCommon").getProperty("Confirmation_TIT");
        sap.m.MessageBox.show(this.getView().getModel("i18nCommon").getProperty("Confirm_Cancel_MSG"), {
            title : title,
            icon : sap.m.MessageBox.Icon.QUESTION,
            actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.YES) {
                    that.setEditMode(false);
                    if (fnActionAfterCancel) {
                        fnActionAfterCancel();
                    }
                } else {
                    if (fnActionOnNoCancellation) {
                        fnActionOnNoCancellation();
                    }
                }
            }
        });
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },
});