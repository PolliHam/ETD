/* globals oTextBundle, Promise */
$.sap.require("sap.secmon.ui.malimon.Constants");
$.sap.require("sap.secmon.ui.m.commons.EtdController");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.malimon.PathVisualization", {

    _oEventAttributesRPopover: undefined,
    ATTACK_PATH_STEP_MODEL: "AttackPathStepModel",
    EVENT_SERIES_ODATA_MODEL: "eventSeriesODataModel",
    APPLICATION_CONTEXT_MODEL: "applicationContext",

    onInit: function () {
        var oEventSeriesODataModel = new sap.ui.model.odata.v2.ODataModel("/sap/secmon/services/eventSeries.xsodata");
        var eventBus = sap.ui.getCore().getEventBus();
        eventBus.subscribe("AttackPathChannel", "onNavigateEvent", this.onEventsReceived, this);
        eventBus.subscribe("AttackPathDetailsChannel", "onNavigateEvent", this.onDisplayAttackPath, this);
        var oAttackPathModel = new sap.ui.model.json.JSONModel({
            names: [], // Array of objects with properties EventName, Timestamp, Id, CustomName
            attributes: [], // Array of objects with properties name, displayName, selected
            data: [], // Array of Event objects with properties for every attribute of that Event (AttributeName : AttributeValue)
            existingAttributes: {}, // Helper Object to identify already existing entries in the attributes Array
            viewTitle: "",
            caseFileId: ""
        });
        var oAttackPathStepModel = new sap.ui.model.json.JSONModel({
            pathName: "",
            description: "",
            idAttackPath: "",
            idCaseFile: "",
            steps: [],
            visibility: ""
        });
        this.getView().setModel(oAttackPathStepModel, this.ATTACK_PATH_STEP_MODEL);
        oAttackPathModel.setSizeLimit(999999);
        this.getView().setModel(oAttackPathModel);
        var oAttackPath = this.getView().byId("idAttackPath");
        this.getView().setModel(oEventSeriesODataModel, this.EVENT_SERIES_ODATA_MODEL);
        oAttackPath.setShowUTC(this.getComponent().getModel(this.APPLICATION_CONTEXT_MODEL).getProperty("/UTC"));
    },


    onRequestCompleted: function () {

        function compareAttributes(a, b) {
            if (a.displayName < b.displayName) {
                return -1;
            }
            if (a.displayName > b.displayName) {
                return 1;
            }
            return 0;
        }

        var oAttackPathModel = this.getView().getModel();
        var oAttackPath = this.getView().byId("idAttackPath");

        // sort AttributesList
        oAttackPathModel.setProperty("/attributes", oAttackPathModel.getProperty("/attributes").sort(compareAttributes));
        oAttackPath.setBusy(false);
        // JUST FOR SHOWCASE PURPOSES IN COMBINATION WITH function showcaseIsDefaultAttr(sAttrName)
        var aAttributes = this._getSelectedItems();
        oAttackPath.setRelevantAttributes(aAttributes, true);
    },


    onEventsReceived: function (channel, event, data) {

        var aEventsIds = data.map(function (oEntry) { return oEntry.objectId; });
        var oAttackPath = this.getView().byId("idAttackPath");
        
        if (data[0].caseFileId) {
            this.getView().getModel(this.ATTACK_PATH_STEP_MODEL).setProperty("/visibility", "saveAttackPath");
        }
        oAttackPath.setBusy(true);

        this._setAttackPathModel(data[0].caseFileId);

        this.getEventsData(aEventsIds).then(function (aEvents) {
            this.handleEventsData(aEvents);
            this.onRequestCompleted();
        }.bind(this)).catch(function (oError) {
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
        }.bind(this));

    },


    getEventsData: function (aEventsIds) {
        var request = {
            "queryOptions": {
                "eventIds": aEventsIds
            }
        };

        return new Promise(function (fnResolve, fnReject) {
            $.ajax({
                type: "POST",
                url: sap.secmon.ui.malimon.Constants.C_LOG_EVENTS_GET_PATH,
                data: JSON.stringify(request),
                contentType: "application/json; charset=UTF-8",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
                },
                success: function (data) {
                    fnResolve(data);
                },
                error: function (oError) {
                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
                }.bind(this)
            });
        });
    },


    handleEventsData: function (aEvents) {

        aEvents.forEach(function (oEvent) {
            this.eventSeriesHandler(oEvent);
        }.bind(this));
    },


    showcaseIsDefaultAttr: function (sAttrName) {
        sAttrName = sAttrName.toLowerCase();

        return (sAttrName.includes("user") && !sAttrName.includes("username")) || sAttrName.includes("ip") || sAttrName.includes("mac") || sAttrName.includes("correlationid") ||
            sAttrName.includes("hostname") || sAttrName.includes("systemid") || sAttrName.includes("instancename");
    },

    eventSeriesHandler: function (oData) {
        var aAttrs = {};
        var oEventSeriesODataModel = this.getView().getModel(this.EVENT_SERIES_ODATA_MODEL);
        var oAttackPathModel = this.getView().getModel();
        var oMetadata = oEventSeriesODataModel.getServiceMetadata();
        var aFieldMetadata = oMetadata.dataServices.schema[0].entityType[0].property;
        var existingAttributes = oAttackPathModel.getProperty("/existingAttributes");
        var showUTC = this.getComponent().getModel(this.APPLICATION_CONTEXT_MODEL).getProperty("/UTC");

        aFieldMetadata.forEach(function (oFieldMetadata) {
            if (!oData[oFieldMetadata.name]) { return; }

            if (oFieldMetadata.type === sap.secmon.ui.malimon.Constants.C_TYPE.DATETIME) {
                var sTimestamp = oData[oFieldMetadata.name];
                oData[oFieldMetadata.name] = new Date(sTimestamp);
                oData[oFieldMetadata.name].displayTime = sap.secmon.ui.commons.Formatter.dateFormatterEx(showUTC, sTimestamp);
            }
            aAttrs[oFieldMetadata.name] = oData[oFieldMetadata.name];
            if (!existingAttributes.hasOwnProperty(oFieldMetadata.name)) { // add unique Attributes to the Array
                // Every attribute that may be relevant for drawing correlations
                // Id is unique, Timestamp and Event name part of visualisation aynway 
                if (oFieldMetadata.name !== sap.secmon.ui.malimon.Constants.C_TYPE.ID && oFieldMetadata.name !== sap.secmon.ui.malimon.Constants.C_TYPE.TIMESTAMP &&
                    oFieldMetadata.name !== sap.secmon.ui.malimon.Constants.C_TYPE.EVENT_NAME) {
                    var isDefaultAttr = this.showcaseIsDefaultAttr(oFieldMetadata.name);
                    var oAttrListElement = {
                        "name": oFieldMetadata.name,
                        "displayName": this.fnToGoodName(oFieldMetadata.name, true),
                        "selected": isDefaultAttr
                    };
                    oAttackPathModel.getProperty("/attributes").push(oAttrListElement);
                    existingAttributes[oFieldMetadata.name] = 1;
                }
            }
        }.bind(this));

        oAttackPathModel.getProperty("/data").push(aAttrs);

        var displayTime = sap.secmon.ui.commons.Formatter.dateFormatterEx(showUTC, aAttrs.Timestamp);
        oAttackPathModel.getProperty("/names").push({
            "EventName": aAttrs.EventName,
            "Timestamp": displayTime,
            "Id": aAttrs.Id,
            "CustomName": ""
        });
    },


    _setAttackPathModel: function (sCaseFileId) {
        var oAttackPathModel = this.getView().getModel();
        oAttackPathModel.setData({
            names: [],
            attributes: [],
            data: [],
            existingAttributes: {},
            caseFileId: sCaseFileId
        });
    },


    _getSelectedItems: function () {
        var oList = this.byId("idAttributesList");
        var aItems = oList.getItems();
        return aItems.filter(function (oItem) {
            return oItem.getBindingContext().getProperty("selected");
        }).map(function (oItem) {
            return oItem.getBindingContext().getProperty("name");
        });
    },


    onDisplayAttackPath: function (channel, event, oData) {
        var oAttackPath = this.getView().byId("idAttackPath");
        var oAttackPathModel = this.getView().getModel();
        this.getView().getModel(this.ATTACK_PATH_STEP_MODEL).setProperty("/visibility", "generatePattern");
        oAttackPathModel.setData({
            names: [],
            attributes: [],
            data: [],
            existingAttributes: {},
            caseFileId : ""
        });
        oAttackPath.setBusy(true);
        this.getAttackPathDetails(oData.idAttackPath).then(function(aData){
           this.prepareAttackPathModel(aData, oData.idAttackPath);
           oAttackPath.setBusy(false);
        }.bind(this)); 
    },

    prepareAttackPathModel : function(aCorrelatedAttributes, idAttackPath){
        var oAttackPath = this.getView().byId("idAttackPath");
        var oAttackPathModel = this.getView().getModel();
        var showUTC = this.getComponent().getModel(this.APPLICATION_CONTEXT_MODEL).getProperty("/UTC");
        var aAttrs = [];
        var oSelectedtAttr4Events = {};
        var existingAttributes = oAttackPathModel.getProperty("/existingAttributes");
        aCorrelatedAttributes.forEach(function (oEvent) {
            var eventId = oEvent.eventId;
            if(!oSelectedtAttr4Events[eventId]){
                 oSelectedtAttr4Events[eventId] = {};
             }
            
            oSelectedtAttr4Events[eventId].Id =  oEvent.eventId;
            oSelectedtAttr4Events[eventId].EventName = oEvent.eventName;
            if(!oSelectedtAttr4Events[eventId].Timestamp){
                oSelectedtAttr4Events[eventId].Timestamp = oSelectedtAttr4Events[eventId].timestamp ? oSelectedtAttr4Events[eventId].Timestamp : new Date(oEvent.timestamp);
                oSelectedtAttr4Events[eventId].Timestamp.displayTime = sap.secmon.ui.commons.Formatter.dateFormatterEx(showUTC, oEvent.timestamp);
            }

            oEvent.correlatedAttributes.forEach(function (oAttribute) {

                if(!oSelectedtAttr4Events[eventId].hasOwnProperty(oEvent.description)){
                    oSelectedtAttr4Events[eventId][oAttribute.description] =  oAttribute.value;
                }

                if (!existingAttributes.hasOwnProperty(oAttribute.description)) {
                    var oAttrListElement = {
                        "name": oAttribute.description,
                        "displayName": this.fnToGoodName(oAttribute.description, true),
                        "selected": true
                    };
                    oAttackPathModel.getProperty("/attributes").push(oAttrListElement);
                    existingAttributes[oAttribute.description] = 1;
                    aAttrs.push(oAttrListElement.name);
                }

            }.bind(this));

        }.bind(this));

        this.getView().getModel(this.ATTACK_PATH_STEP_MODEL).setProperty("/idAttackPath", idAttackPath);

        for (var key in oSelectedtAttr4Events){
            oAttackPathModel.getProperty("/names").push({
                "EventName" : oSelectedtAttr4Events[key].EventName,
                "Timestamp" : sap.secmon.ui.commons.Formatter.dateFormatterEx(showUTC, oSelectedtAttr4Events[key].Timestamp),
                "Id" : oSelectedtAttr4Events[key].Id,
                "CustomName" : ""
            });
        }
        oAttackPath.setRelevantAttributes(aAttrs, true);
        oAttackPathModel.setProperty("/data", Object.values(oSelectedtAttr4Events));
        
    },

    getAttackPathDetails : function(sAttackPathId){
        var oPromise = new Promise(function (fnResolve, fnReject) {
            jQuery.ajax({
                method: "GET",
                url: "/sap/secmon/services/malimon/saveAttackPath.xsjs?attackPathId=" + sAttackPathId,
                beforeSend : function(xhr) {
                    xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
                },
                success: function (data, status, oResponse) {
                    fnResolve(data);   
                }, 
                error: function (data, status, oResponse) {
                    fnReject({
                        data: data,
                        status: status,
                        response: oResponse
                    });
                }.bind(this)
            });
        }.bind(this));
        
        return oPromise;
    },

    onSelectionChange : function(oEvent) {
        // Update relevant Attributes in AttackPath
        var oItem = oEvent.getParameter("listItem");
        var oAttribute = oItem.getBindingContext().getObject();
        var oAttackPath = this.getView().byId("idAttackPath");
        oAttackPath.setRelevantAttributes([ oAttribute.name ], oAttribute.selected);

        // When all are selected, the button should read "deselect"
        var oList = this.getView().byId("idAttributesList");
        if (!oList.isAllSelectableSelected()) {
            this.getView().byId("idSelectAllButton").setProperty("text", "Select All");
        } else {
            this.getView().byId("idSelectAllButton").setProperty("text", "Deselect All");
        }
    },

    onSelectAll : function(oEvent) {
        var oAttackPath = this.getView().byId("idAttackPath");
        var oList = this.getView().byId("idAttributesList");
        var items = oList.getItems();

        var attributes = [];
        for (var i = 0; i < items.length; i++) {
            attributes.push(items[i].getBindingContext().getProperty().name);
        }

        if (!oList.isAllSelectableSelected()) {
            oList.selectAll();
            oAttackPath.setRelevantAttributes(attributes, true);
            oEvent.getSource().setProperty("text", "Deselect All");
        } else {
            oList.removeSelections();
            oAttackPath.setRelevantAttributes(attributes, false);
            oEvent.getSource().setProperty("text", "Select All");
        }

        // oAttackPathModel.refresh();
    },

    onEventNameEditPress : function(oEvent) {
        var that = this;
        var oBound = oEvent.getSource().getBindingContext().getObject();
        var oModel = oEvent.getSource().getModel();

        // Dialog allowing user to give a custom name to an element

        var oDialog = new sap.m.Dialog();
        var oInput = new sap.m.Input();
        var oLabel = new sap.m.Label();

        oLabel.setText("Custom Name:");
        oLabel.addStyleClass("sapUiSmallMarginTop sapUiSmallMarginBegin");
        oDialog.addContent(oLabel);

        oInput.addStyleClass("sapUiSmallMarginBegin sapUiSmalLMarginEnd sapUiSmallMarginBottom");
        oInput.setProperty("placeholder", (oBound.CustomName) ? oBound.CustomName : "Custom Name");
        oInput.setProperty("width", "90%");
        oDialog.addContent(oInput);

        oDialog.setTitle(oTextBundle.getText("MM_LBL_InsertAlias"));

        oDialog.addButton(new sap.m.Button({
            text : oTextBundle.getText("Commons_Ok"),
            type : sap.m.ButtonType.Accept,
            press : function(oEvent) {
                // move from button to input field
                var sCustomName = oEvent.getSource().getParent().getParent().getContent()[1].getValue();
                oBound.CustomName = sCustomName;
                oModel.updateBindings();
                oDialog.close();
                // refer custom name to attack path
                that.getView().byId("idAttackPath").setCustomNameForID(oBound.Id, sCustomName);
            }
        }));
        oDialog.addButton(new sap.m.Button({
            text : oTextBundle.getText("Commons_Cancel"),
            type : sap.m.ButtonType.Reject,
            press : function() {
                oDialog.close();
            }
        }));

        oDialog.open();

    },

    handleMenuItemPress : function(oEvent) {
        switch (oEvent.getParameter("item").getText()) {
        case "Show Event Attributes":
            this.showAttributesPopover(oEvent);
            break;
        case "Next correlating Event":
            sap.m.MessageToast.show("This feature has not yet been implemented!");
            break;
        }
    },

    showAttributesPopover : function(oEvent) {
        var oEventAttributesModel;
        if (!this._oEventAttributesRPopover) {
            oEventAttributesModel = new sap.ui.model.json.JSONModel();
            var oEventAttributes = new sap.secmon.ui.malimon.EventAttributes({
                data : {
                    path : "/data",
                    template : new sap.ui.base.ManagedObject()
                },
            }).setModel(oEventAttributesModel);

            this._oEventAttributesRPopover = new sap.m.ResponsivePopover({
                title : oTextBundle.getText("MM_TIT_EventAttribs"),
                // placement : sap.m.PlacementType.Auto,
                content : [ oEventAttributes ],
                modal : false,
                resizable : true
            }).setModel(oEventAttributesModel);
            this._oEventAttributesRPopover.addStyleClass('sapUiSizeCompact').addStyleClass('sapUiContentPadding').addStyleClass('sapEtdPopoverTransparent');
            this.getView().addDependent(this._oEventAttributesRPopover);
        }

        // prepare Data
        var nodeId = oEvent.getSource().getParent().nodeId;
        var aData = this.getView().getModel().getProperty("/data");
        var oNode;
        var dataIterator = aData.entries();
        do {
            oNode = dataIterator.next().value[1];
        } while (oNode.Id !== nodeId && oNode !== undefined);
        if (!oNode) {
            return;
        }
        var aAttrs = [];
        for ( var key in oNode) {
            if (oNode.hasOwnProperty(key)) {
                aAttrs.push({
                    "name" : key,
                    "displayName" : this.fnToGoodName(key, true),
                    "value" : oNode[key],
                    "isHyperlink" : false
                });
            }
        }
        oEventAttributesModel = this._oEventAttributesRPopover.getModel();
        oEventAttributesModel.setProperty("/data", aAttrs);

        if (this._oEventAttributesRPopover.isOpen()) {
            this._oEventAttributesRPopover.close();
        }

        var oTarget = oEvent.getSource().getParent().target;
        var nTargetCX = oTarget.getAttribute("cx");
        if ((nTargetCX - 100) > (document.documentElement.clientWidth / 2)) {
            this._oEventAttributesRPopover.setPlacement(sap.m.PlacementType.Left);
        } else {
            this._oEventAttributesRPopover.setPlacement(sap.m.PlacementType.Right);
        }

        // Avoid adding the same circle to the case file by disabling the Add2CaseFile button
        this._oEventAttributesRPopover.getContent()[0].setShowAdd2CaseFile(false);

        this._oEventAttributesRPopover.openBy(oTarget);
    },

    fnToGoodName : function(sName, bShort) {
        var oFieldNamesData = sap.ui.getCore().getModel("FieldNamesModel").getData();
        var sContext = "Log";
        // in case the sName is not found => echo
        var result = sName;
        if (bShort) {
            if (sName === sap.secmon.ui.malimon.Constants.C_TYPE.EVENT && oFieldNamesData[sContext].EventCode){ 
                result = oFieldNamesData[sContext].EventCode.displayName; 
            }
            if (oFieldNamesData[sContext] && oFieldNamesData[sContext][sName] && oFieldNamesData[sContext][sName].displayName) {
                result = oFieldNamesData[sContext][sName].displayName;
            }
        } else {
            if (oFieldNamesData[sContext] && oFieldNamesData[sContext][sName] && oFieldNamesData[sContext][sName].description) {
                result = oFieldNamesData[sContext][sName].description;
            }
        }
        return result;
    },

    onGenerateWorkspace : function(){
        var sLanguage = sap.secmon.ui.m.commons.NavigationService.getLanguage();
        var sPath = this.getView().getModel(this.ATTACK_PATH_STEP_MODEL).getProperty("/idAttackPath");
        window.open("/sap/secmon/ui/browse/?Ids="+ sPath + sLanguage);
    },

    onSaveAttackPath: function () {

        this.attackPathDialog = sap.ui.xmlfragment("sap.secmon.ui.malimon.saveAttackPathDialog", this);
        this.getView().addDependent(this.attackPathDialog);
        this.attackPathDialog.open();
    },

    onSubmitSaveAttackPathDialog : function () {

        var idCaseFile = this.getView().getModel().getProperty("/caseFileId");
        this.getView().getModel(this.ATTACK_PATH_STEP_MODEL).setProperty("/idCaseFile", idCaseFile);
        var oData = this.getView().getModel(this.ATTACK_PATH_STEP_MODEL).getData();
        var sUrl = "/sap/secmon/services/malimon/saveAttackPath.xsjs";
        $.ajax({
            url: sUrl,
            type: "POST",
            contentType: "application/json;charset=utf-8",
            data: JSON.stringify(oData),
            beforeSend: function (xhr) {
                xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
            }
        })
            .done(function (data, textStatus, XMLHttpRequest) {
                this.onCloseSaveAttackPathDialog();
                this.onDisplayAttackPath(null, null, JSON.parse(data));
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, oTextBundle
                    .getText("Saved_attackPath"));
                //TO DO
            }.bind(this))
            .fail(function (jqXHR, textStatus, errorThrown) {
                this.onCloseSaveAttackPathDialog();
                var sMessageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sMessageText);
            }.bind(this));

    },

    onCloseSaveAttackPathDialog: function(){
        this.attackPathDialog.close();
        this.attackPathDialog.destroy();
    },
    
    onNodeRightClick : function(oEvent) {
        if (!this._contextMenu) {
            this._contextMenu = sap.ui.xmlfragment("sap.secmon.ui.malimon.AttackPathContextMenu", this);
            this.getView().addDependent(this._contextMenu);
        }
        if (this._contextMenu.isActive()) {
            this._contextMenu.close();
        }
        this._contextMenu.nodeId = oEvent.getParameter("id");
        this._contextMenu.target = oEvent.getParameter("domElem");
        var eDock = sap.ui.core.Popup.Dock;
        this._contextMenu.open(false, this._contextMenu.target, eDock.BeginTop, eDock.BeginBottom, this._contextMenu.target, "16 16");
    },

    onNodeLeftClick : function(oEvent) {
        if (this._contextMenu && this._contextMenu.isActive()) {
            this._contextMenu.close();
        }
    },

    onAfterRendering : function() {
        // this.getView().getModel().setProperty("/viewTitle", oTextBundle.getText("MM_TIT_AttackPath"));
    },

    onNavBack : function(oEvent) {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    onExit : function() {
        var eventBus = sap.ui.getCore().getEventBus();
        eventBus.unsubscribe("AttackPathChannel", "onNavigateEvent", this.onEventsReceived, this);
        eventBus.unsubscribe("AttackPathDetailsChannel", "onNavigateEvent", this.onDisplayAttackPath, this);
    }
});