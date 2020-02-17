jQuery.sap.declare("sap.secmon.ui.m.invest.view.InvestigationObjectHelper");

jQuery.sap.require("sap.secmon.ui.commons.RelatedEventsHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.semanticEvents.LogDetailHelper");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.AlertTriggerFormatter");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.semanticEventViewer.util.Formatter");

jQuery.sap.require("sap.secmon.ui.m.alerts.util.CompactTriggerHelper");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/TightObjectHeader.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.invest.view.InvestigationObjectHelper =
        (function() {
            return {

                handleAlertRowSelection : function(oEvent, oLayout) {
                    var i18nModel = new sap.ui.model.resource.ResourceModel({
                        bundleUrl : "/sap/secmon/ui/m/alerts/i18n/UIText.hdbtextbundle"
                    }), path;
                    if (!this.alertDetailsForm) {
                        this.alertDetailsForm = sap.ui.xmlfragment(this.getView().createId("AlertForm"), "sap.secmon.ui.m.invest.view.AlertDisplay", this);
                        this.alertDetailsForm.setModel(i18nModel, "i18n");
                    }

                    oLayout.addContentArea(this.alertDetailsForm);
                    var oSelectedItem = oEvent.getSource().getSelectedItem();
                    var sBindingContext = oSelectedItem.getBindingContextPath();
                    var oObject = this.getView().getModel().getProperty(sBindingContext);

                    var sAlertId = this.oCommons.base64ToHex(oObject.Id);
                    this.updateRelatedEventCount(sAlertId);
                    path = "/Alerts(AlertId=X'" + sAlertId + "')";
                    this.alertDetailsForm.bindElement(path);
                    sap.secmon.ui.m.alerts.util.CompactTriggerHelper.compactifyDetails(this, this.compactDetailsModel, i18nModel, path + "/Details");
                    this.alertDetailsForm.setModel(this.compactDetailsModel, "compactDetails");
                },

                handleHealthCheckRowSelection : function(oEvent, oLayout, oObject) {
                    if (!this.healthCheckForm) {
                        this.healthCheckForm = sap.ui.xmlfragment(this.getView().createId("HealthCheckForm"), "sap.secmon.ui.m.invest.view.HealthCheckView", this);
                    }

                    oLayout.addContentArea(this.healthCheckForm);
                    this.healthCheckForm.bindElement("/HealthCheck(InvestigationId=X'" + this.oCommons.base64ToHex(oObject["InvestigationId.Id"]) + "',HeaderId=X'" +
                            this.oCommons.base64ToHex(oObject.Id) + "')");
                },

                handleFSpaceCheckRowSelection : function(oEvent, oLayout, oObject) {
                    var crumbModel = this.getView().getModel("crumb");
                    var table = this.getView().byId("Objects");
                    var oTemplate = table.removeItem(0);
                    crumbModel.setProperty("/linkEnabled", true);
                    crumbModel.setProperty("/Name", oObject.Name);
                    if (oTemplate !== undefined && oTemplate !== null) {
                        var aFilters =
                                [ new sap.ui.model.Filter("InvestigationId.Id", sap.ui.model.FilterOperator.EQ, this.oCommons.base64ToHex(oObject["InvestigationId.Id"])),
                                        new sap.ui.model.Filter("ObjectId", sap.ui.model.FilterOperator.EQ, this.oCommons.base64ToHex(oObject.ObjectId)) ];
                        var oFilter = new sap.ui.model.Filter({
                            filters : aFilters,
                            and : true
                        });
                        table.bindAggregation("items", '/FSpaceChildren', oTemplate, new sap.ui.model.Sorter("CreationTimestamp", true), oFilter);
                    }
                },

                handleEventRowSelection : function(oEvent, oLayout, oObject) {
                    var that = this;
                    var i18nModel = new sap.ui.model.resource.ResourceModel({
                        bundleUrl : "/sap/secmon/ui/m/commons/semanticEvents/i18n/UIText.hdbtextbundle"
                    });
                    this.getView().setModel(i18nModel, "lang");                    
                    if (!this.eventDetailsForm) {
                        this.eventDetailsForm = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.invest.view.EventDisplay", this);
                        // i18nknowledge has to be set, because otherwise the model cannot be used in the formatter for unknown reasons
                        this.eventDetailsForm.setModel(this.getView().getModel("i18nknowledge"), "i18nknowledge");
                        this.eventDetailsForm.setModel(this.eventsModel);
                        this.eventsModel.attachRequestCompleted(function() {
                            that.eventDetailsForm.setBusy(false);
                        });                        
                    }
                    this.eventDetailsForm.setBusy(true);
                    this.getView().byId("original-data-panel").setExpanded(false);                  
                    oLayout.addContentArea(this.eventDetailsForm);

                    var eventId = this.oCommons.base64ToHex(oObject.Id),
                        eventTimestamp = oObject.CreationTimestamp.toISOString(),
                        eventTechnicalTimestamp = oObject.CreationTimestamp.getTime();
                    this.eventDetailsForm.bindElement("/NormalizedLog(Id=X'" + eventId + "',Timestamp=datetime'" + eventTimestamp + "',TechnicalTimestampInteger=" + eventTechnicalTimestamp + "L)", {
                        expand : "UserPseudonyms,UserPseudonyms/Sentences"
                    });
                    var logDetailHelper = new sap.secmon.ui.m.commons.semanticEvents.LogDetailHelper();
                    logDetailHelper.rebindData(this.getView().byId("event-details"), {
                        "Id" : eventId,
                        "Timestamp" : eventTimestamp
                    });
                },

                handlePatternWorkspaceClicked : function(oEvent) {
                    var oContext = oEvent.getSource().getBindingContext();
                    var oQueryStartTimestamp = oContext.getProperty("QueryStartTimestamp");
                    var oQueryEndTimestamp = oContext.getProperty("QueryEndTimestamp");
                    var sPatternIdBase64 = oContext.getProperty("PatternId");
                    var sPatternId = this.oCommons.base64ToHex(sPatternIdBase64);
                    sap.secmon.ui.m.commons.NavigationService.openBrowseUI(sPatternId, oQueryStartTimestamp, oQueryEndTimestamp);
                },

                onTriggeringEventsClicked : function(oEvent) {
                    var oContext = oEvent.getSource().getBindingContext();
                    var sAlertIdBase64 = oContext.getProperty("AlertId");
                    var sAlertId = this.oCommons.base64ToHex(sAlertIdBase64);
                    sap.secmon.ui.m.commons.NavigationService.openLogViewerForAlert(sAlertId);
                },
                onCrumbPressed : function(oEvent) {
                    var crumbModel = this.getView().getModel("crumb");
                    var table = this.getView().byId("Objects");
                    var oTemplate = table.removeItem(0);
                    var bindingContext, object;
                    crumbModel.setProperty("/linkEnabled", false);
                    crumbModel.setProperty("/Name", "");
                    if (oTemplate !== undefined && oTemplate !== null) {
                        bindingContext = this.getView().getBindingContext();
                        object = bindingContext.getObject();
                        table.bindAggregation("items", "/Investigation(X'" + this.oCommons.base64ToHex(object.Id) + "')/Objects", oTemplate, new sap.ui.model.Sorter("CreationTimestamp", true));
                    }
                },

                onSystemTriggerPress : function(oEvent) {
                    var bindingContext = oEvent.getSource().getBindingContext("compactDetails");
                    var sSystemId = bindingContext.getProperty("Value");
                    var sSystemType = bindingContext.getProperty("typeValue");
                    sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                        target : {
                            semanticObject : "System",
                            action : "show",
                        },
                        params : {
                            system : sSystemId,
                            type : sSystemType,
                            tab : "eventTrend"
                        }
                    });
                },

                updateRelatedEventCount : function(sAlertId) {
                    this.relatedEvents = sap.ui.core.Fragment.byId(this.getView().createId("AlertForm"), "relatedEvents");
                    function updateRelatedEventCountWith(count, sFilter) {
                        this.relatesEventsModel.setProperty('/relatedEvents', count);
                        this.relatesEventsModel.setProperty('/relatedEventsFilter', sFilter);
                        // if (typeof count === "number") {
                        this.relatedEvents.setLinkEnabled(true);
                        this.relatedEvents.setBusyEnabled(false);
                        // }
                    }
                    this.relatedEvents.setBusyEnabled(true);
                    this.relatedEvents.setLinkEnabled(false);

                    sap.secmon.ui.commons.RelatedEventsHelper.getRelatedEventCountAsDeferred(sAlertId).done(function(count, sFilter) {
                        updateRelatedEventCountWith.call(this, count, sFilter);
                    }.bind(this));
                },

                onRelatedEventsClicked : function(oEvent) {
                    var sFilter = this.relatesEventsModel.getProperty('/relatedEventsFilter');
                    sap.secmon.ui.m.commons.NavigationService.openLogViewerWithParams(sFilter);
                },

                onObjectClicked : function(oEvent) {
                    var type = oEvent.getSource().getBindingContext().getProperty("ObjectType");
                    var objectIdBase64 = oEvent.getSource().getBindingContext().getProperty("ObjectId");
                    var objectId = this.oCommons.base64ToHex(objectIdBase64);
                    var fnNavigator;
                    if (type === "ALERT") {
                        fnNavigator = this.navigateToAlert.bind(this, objectId);
                    } else if (type === "SNAPSHOT") {
                        fnNavigator = sap.secmon.ui.m.commons.NavigationService.openSnapshotUI.bind(this, objectId);
                    } else if (type === "FSPACE") {
                        fnNavigator = sap.secmon.ui.m.commons.NavigationService.openCaseFile.bind(this, objectId);
                    }
                    if (fnNavigator !== undefined) {
                        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
                            fnNavigator();
                        });
                    }
                },

                cleanupObjectViewForDeletion : function(id, type) {
                    var oSelItem = this.getView().byId("Objects").getSelectedItem();
                    if (oSelItem) {
                        var sPath = oSelItem.getBindingContextPath();
                        var oSelItemData = this.getView().getModel().getProperty(sPath);
                        if (this.oCommons.base64ToHex(oSelItemData.ObjectId) === id) {
                            switch (type) {
                            case "ALERT":
                                if (this.alertDetailsForm) {
                                    this.alertDetailsForm.unbindElement();
                                }
                                break;
                            case "EVENT":
                                if (this.eventDetailsForm) {
                                    this.eventDetailsForm.unbindElement();
                                }
                                break;
                            case "HEALTHCHECK":
                                if (this.healthCheckForm) {
                                    this.healthCheckForm.unbindElement();
                                }
                                break;
                            }

                            var oLayout = this.getView().byId("iconTabBarObjects");
                            var content = oLayout.getContentAreas();
                            if (content.length > 1) {
                                oLayout.removeContentArea(content[1]);
                            }
                        }
                    }
                },

                onRemoveObject : function(oEvent) {
                    var oBindingContext = oEvent.getSource().getBindingContext();
                    var objectType = oBindingContext.getProperty("ObjectType");
                    var objectId = this.oCommons.base64ToHex(oBindingContext.getProperty("ObjectId"));
                    var objectName = oBindingContext.getProperty("Name");
                    var oI18nModel = this.getView().getModel("i18nInvest");
                    var sConfirmationText;
                    switch (objectType) {
                    case "ALERT":
                        sConfirmationText = oI18nModel.getProperty("MInvest_ConfirmRemoveAlert");
                        break;
                    case "EVENT":
                        sConfirmationText = oI18nModel.getProperty("MInvest_ConfirmRemoveEvent");
                        break;
                    case "HEALTHCHECK":
                        sConfirmationText = oI18nModel.getProperty("MInvest_ConfirmRemoveHchck");
                        break;
                    case "SNAPSHOT":
                        sConfirmationText = oI18nModel.getProperty("MInvest_ConfirmRemoveSnap");
                        break;
                    case "FSPACE":
                        sConfirmationText = oI18nModel.getProperty("MInvest_ConfirmRemoveFSpc");
                        break;
                    }

                    if (objectName === null) {
                        objectName = "";
                    }
                    sConfirmationText = sap.secmon.ui.commons.Formatter.i18nText(sConfirmationText, objectName);
                    var that = this;
                    sap.m.MessageBox.confirm(sConfirmationText, {
                        onClose : function(oAction) {
                            if (oAction === sap.m.MessageBox.Action.OK) {
                                sap.secmon.ui.m.invest.view.InvestigationObjectHelper.cleanupObjectViewForDeletion.call(that, objectId, objectType);
                                sap.secmon.ui.m.invest.view.InvestigationObjectHelper.removeObjectFromInvestigation.call(that, objectId, objectType);
                            }
                        }
                    });
                },

                removeObjectFromInvestigation : function(id, type) {
                    var sToken = this.getComponent().getCsrfToken();
                    var that = this;
                    var oData = {
                        InvestigationId : this.oCommons.base64ToHex(this.getView().getBindingContext().getProperty("Id")),
                        Assignments : [ {
                            ObjectType : type,
                            ObjectId : id
                        } ]
                    };
                    $.ajax({
                        url : this.INVESTIGATION_SERVICE_URL + "/Assignments",
                        type : "DELETE",
                        dataType : "text",
                        data : JSON.stringify(oData),
                        beforeSend : function(xhr) {
                            xhr.setRequestHeader("X-CSRF-Token", sToken);
                        },
                        success : function() {
                            that.getView().getModel().refresh();
                        },
                        error : function(request, status, error) {
                            sap.m.MessageBox.alert(request.responseText, {
                                title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                            });
                        }
                    });
                },

            };
        }());
