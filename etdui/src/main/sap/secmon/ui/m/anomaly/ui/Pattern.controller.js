$.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");
$.sap.require("sap.secmon.ui.m.anomaly.ui.AnomalyPatterns");
$.sap.require("sap.secmon.ui.m.commons.EtdController");
$.sap.require("sap.secmon.ui.m.anomaly.ui.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.anomaly.ui.Pattern", {
    
            EXPORT_SERVICE : "/sap/secmon/services/replication/export.xsjs",
            oRouter : null,
            anomalyPatterns : null,

            getFilters : function() {
                var aFilters = [];
                var sQuery = this.getView().byId("TreeSearchField").getValue();
                if (sQuery && sQuery.length > 2) {
                    var filter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sQuery);
                    aFilters.push(filter);
                }
                return aFilters;
            },
            handleExpand : function() {
                var table = this.getView().byId("treeTable");
                var rows = table.getRows();
                rows.forEach(function(row, index) {
                    table.expand(index);
                });
            },
            handleCollapse : function() {
                var table = this.getView().byId("treeTable");
                table.collapseAll();
            },
            refreshData : function() {
                var oObjectList = this.getView().getModel("ObjectList");
                var i18n = this.getComponent().getModel("i18n");
                oObjectList.loadData(sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_OBJECT_LIST_PATH, null, false);
                var data = oObjectList.getData();
                var pattern = {};
                var features = {};
                var aFilters = this.getFilters();
                data.anomalyObject.forEach(function(x) {
                    x.match =
                            aFilters.some(function(filter) {
                                return x.Name.toLowerCase().includes(filter.oValue1.toLowerCase()) || x.Namespace.toLowerCase().includes(filter.oValue1.toLowerCase()) ||
                                        (x.hasOwnProperty("Description") && x.Description && x.Description.toLowerCase().includes(filter.oValue1.toLowerCase())) ||
                                        (x.hasOwnProperty("CreatedBy") && x.CreatedBy && x.CreatedBy.toLowerCase().includes(filter.oValue1.toLowerCase())) ||
                                        (x.hasOwnProperty("ChangedBy") && x.ChangedBy && x.ChangedBy.toLowerCase().includes(filter.oValue1.toLowerCase()));
                            });
                    if (aFilters.length === 0 || !aFilters[0].oValue1) {
                        x.match = true;
                    }

                    if (x.Type === "Pattern" && !pattern.hasOwnProperty(x.Id)) {
                        pattern[x.Id] = x;
                    }
                    if (x.Type === "Feature" && !features.hasOwnProperty(x.Id)) {
                        features[x.Id] = x;
                    }
                });
                var newData = {
                    anomalyObject : []
                };

                newData.anomalyObject =
                        data.anomalyObject.reduce(function(prev, curr, index, array) {
                            var currentObject = curr;

                            if (aFilters && aFilters.length > 0) {
                                currentObject.match =
                                        aFilters.some(function(filter) {
                                            return currentObject.Name.toLowerCase().includes(filter.oValue1.toLowerCase()) ||
                                                    currentObject.Namespace.toLowerCase().includes(filter.oValue1.toLowerCase()) ||
                                                    (currentObject.hasOwnProperty("Description") && currentObject.Description && currentObject.Description.toLowerCase().includes(
                                                            filter.oValue1.toLowerCase())) ||
                                                    (currentObject.hasOwnProperty("CreatedBy") && currentObject.CreatedBy && currentObject.CreatedBy.toLowerCase().includes(
                                                            filter.oValue1.toLowerCase())) ||
                                                    (currentObject.hasOwnProperty("ChangedBy") && currentObject.ChangedBy && currentObject.ChangedBy.toLowerCase().includes(
                                                            filter.oValue1.toLowerCase()));
                                        });
                            }
                            if (!prev.hasOwnProperty(curr.Type)) {
                                prev[curr.Type] = {
                                    Name : curr.Type,
                                    Childs : [],
                                    createNew : true,
                                    deleteObject : false,
                                    createType : curr.Type.toUpperCase(),
                                    tooltip : i18n.getProperty(curr.Type + "Descr")
                                };

                            }
                            curr.createNew = false;
                            curr.deleteObject = true;
                            curr.color = curr.match ? "black" : "lightgrey";
                            if (curr.hasOwnProperty("Description")) {
                                curr.tooltip = curr.Description;
                            }
                            prev[curr.Type].Childs.push(curr);
                            if (curr.hasOwnProperty("Features") && curr.Features) {
                                curr.Feature = {
                                    Name : "Feature",
                                    Childs : [],
                                    deleteObject : false,
                                    tooltip : i18n.getProperty("FeatureDescr")
                                };
                                if (curr.Type === "Scenario") {
                                    curr.Feature.createNew = true;
                                    curr.Feature.ScenarioName = curr.Name;
                                    curr.Feature.ScenarioNamespace = curr.Namespace;
                                    curr.Feature.createType = "FEATURE";

                                } else {
                                    curr.Feature.createNew = false;
                                }
                                curr.Features.forEach(function(y) {
                                    var x = features[y.Id];
                                    curr.Feature.Childs.push(x);
                                    x.Type = "Feature";
                                    x.createNew = false;
                                    x.deleteObject = false;
                                    x.tooltip = x.description;
                                });
                                delete curr.Features;
                            }
                            if (curr.hasOwnProperty("Patterns") && curr.Patterns) {
                                curr.Pattern = {
                                    Name : "Pattern",
                                    Childs : [],
                                    deleteObject : false,
                                    tooltip : i18n.getProperty("PatternDescr")
                                };
                                if (curr.Type === "Scenario") {
                                    curr.Pattern.createNew = true;
                                    curr.Pattern.ScenarioName = curr.Name;
                                    curr.Pattern.ScenarioNamespace = curr.Namespace;
                                    curr.Pattern.createType = "PATTERN";
                                } else {
                                    curr.Pattern.createNew = false;
                                }
                                curr.Patterns.forEach(function(y) {
                                    var x = pattern[y.Id];
                                    curr.Pattern.Childs.push(x);
                                    x.Type = "Pattern";
                                    x.createNew = false;
                                    x.deleteObject = false;
                                });
                                delete curr.Patterns;
                            }
                            return prev;
                        }, {});

                // this coding ensures, that only nodes are visible after searching
                // which have a 'match' or a matching child. In that case all children
                // of the parent(s) are displayed
                function checkIfSearchMatchesForAChild(treeNodes) {
                    return [ "Feature", "Pattern" ].some(function(attribute) {
                        if (treeNodes.hasOwnProperty(attribute) && treeNodes[attribute].hasOwnProperty("Childs")) {
                            // only patterns can have children
                            return treeNodes[attribute].Childs.some(function(x, index, array) {
                                if (x.hasOwnProperty("match") && x.match) {
                                    x.toBeDeleted = false;
                                    return true;
                                } else {
                                    x.toBeDeleted = !checkIfSearchMatchesForAChild(x);
                                    return !x.toBeDeleted;
                                }
                            });
                        } else if (treeNodes.hasOwnProperty("match") && treeNodes.match) {
                            // for features the own match attribute has to be checked
                            treeNodes.toBeDeleted = false;
                            return true;
                        }
                        // no children and no match
                        treeNodes.toBeDeleted = true;
                        return false;
                    });
                }

                // loop through all nodes and checkIfSearchMatchesForAChild
                [ "Scenario", "Feature", "Pattern" ].forEach(function(attribute) {
                    if (newData.anomalyObject.hasOwnProperty(attribute) && newData.anomalyObject[attribute].hasOwnProperty("Childs")) {
                        newData.anomalyObject[attribute].Childs.forEach(function(x) {
                            x.toBeDeleted = !checkIfSearchMatchesForAChild(x);
                        });
                    }
                });

                // delete all nodes where toBeDeleted is true
                [ "Scenario", "Feature", "Pattern" ].forEach(function(attribute) {
                    newData.anomalyObject[attribute].Childs = newData.anomalyObject[attribute].Childs.filter(function(x) {
                        return !x.toBeDeleted;
                    });
                });

                oObjectList.setData(newData);

            },

            /**
             * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do
             * other one-time initialization.
             * 
             * @memberOf sap.secmon.ui.m.anomaly.ui.Shell
             */
            onInit : function() {
                var oObjectList = new sap.ui.model.json.JSONModel();
                oObjectList.setSizeLimit(3000);
                var oUIModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oObjectList, "ObjectList");
                this.getView().setModel(oUIModel, "uiModel");
                var oObjectModel = new sap.ui.model.json.JSONModel();
                this.getView().setModel(oObjectModel, "ObjectModel");

                this.createAndFillNamespacesModel();

                var uiModelData = {
                    createNew : false,
                    deleteObject : false,
                    savedItemSelected : false,
                    infoMessageWasShown : false
                };
                oUIModel.setData(uiModelData);
                this.refreshData();
                this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);

            },
            getGroupHeader : function(oGroup) {
                return new sap.m.GroupHeaderListItem({
                    title : oGroup.key,
                    upperCase : false
                });
            },
            visible : function(o) {
                if (!o) {
                    return false;
                }
                return o.hasOwnProperty("length") && o.length > 0;
            },
            onAfterRendering : function() {
                this.anomalyPatterns = this.getView().byId("anomalyPatterns");
                this.anomalyPatterns.setModel(this.getView().getModel("ObjectModel"));
            },

            onNavBack : function() {
                this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
                    window.history.go(-1);
                });
            },
            handleCreateEvaluation : function(oEvent) {
                this.getView().getModel("uiModel").setProperty("/savedItemSelected", false);
                this.anomalyPatterns.initialize(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, null);
            },
            handleCreatePattern : function(oEvent) {
                this.getView().getModel("uiModel").setProperty("/savedItemSelected", false);
                this.anomalyPatterns.initialize(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN, null);
            },
            handleCreateScenario : function(oEvent) {
                this.getView().getModel("uiModel").setProperty("/savedItemSelected", false);
                this.anomalyPatterns.initialize(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO, null);
            },
            handleDropDownPressed : function(oEvent) {
                var oButton = oEvent.getSource();
                if (!this._menu) {
                    this._menu = sap.ui.xmlfragment("sap.secmon.ui.m.anomaly.ui.CreateMenu", this);
                    this.getView().addDependent(this._menu);
                }
                var eDock = sap.ui.core.Popup.Dock;
                this._menu.open("keyup", oButton, eDock.BeginTop, eDock.BeginBottom, oButton);

            },
            handleCreatePressed : function(oEvent) {
                var table = this.getView().byId("treeTable");
                var data = table.getContextByIndex(table.getSelectedIndex()).getObject();
                if (data.ScenarioName) {
                    this.navigateToObject({
                        Type : sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO,
                        Name : data.ScenarioName,
                        Namespace : data.ScenarioNamespace
                    });
                    this.addNewObjectToScenario(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE[data.createType]);
                    return;
                }
                this.getView().getModel("uiModel").setProperty("/savedItemSelected", false);            
                switch (data.createType) {
                case "SCENARIO":
                    this.anomalyPatterns.initialize(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO, null);
                    break;
                case "FEATURE":
                    this.anomalyPatterns.initialize(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE, null);
                    break;
                case "PATTERN":
                    this.anomalyPatterns.initialize(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN, null);
                    break;
                }
            },
            handleDeletePressed : function(oEvent) {
                var table = this.getView().byId("treeTable");
                var data = table.getContextByIndex(table.getSelectedIndex()).getObject();

                this.deleteObject(data, this.anomalyPatterns, data.Id, this);
            },
            handleLiveChange : function(oEvent) {
                // add filter for search

                this.refreshData();
            },
            handleEventRefresh : function(oEvent) {
                var controller = this.getView().getController();
                controller.refreshData.call(controller);
            },
            handleRowSelectionChange : function(oEvent) {
                var oBindingContext = oEvent.getParameters().rowContext;   
                var oUIModel = this.getView().getModel("uiModel");
                if (oBindingContext) {
                    var data = oBindingContext.getObject();
                    oUIModel.setProperty("/createNew", data.createNew);
                    oUIModel.setProperty("/deleteObject", data.deleteObject);
                    return;
                }
                oUIModel.setProperty("/createNew", false);
                oUIModel.setProperty("/deleteObject", false);
            },
            handleRouteMatched : function(oEvent) {
                /*
                 * This event is called if the route itself matches, but also if a "subroute" matches. In our case, the subroute for alert contains also the URL-query parameters, where this view
                 * should be filtered to.
                 */
                var args = oEvent.getParameter("arguments");
                if (args === null || args === undefined) {
                    return;
                }
                var name = oEvent.getParameter("name");
                if (name === "analysis" || name === "analysePattern") {
                    return;
                }

                var scenarioName, scenarioNS;

                this.patternId = args.patternId;
                this.evaluationId = args.evaluationId;
                if (args.name && args.namespace) {
                    scenarioName = decodeURIComponent(args.name);
                    scenarioNS = decodeURIComponent(args.namespace);
                }
                var oQueryParameters = args["?query"];
                if (oQueryParameters) {
                    this.patternId = this.patternId || oQueryParameters.patternId;
                    this.evaluationId = this.evaluationId || oQueryParameters.evaluationId;
                }

                var oUIModel = this.getView().getModel("uiModel");

                // select pattern or scenario with ID specified in URL
                if (scenarioName && scenarioNS) {
                    this.anomalyPatterns.initialize('Scenario', null, scenarioName, scenarioNS);
                    oUIModel.setProperty("/savedItemSelected", true);
                    oUIModel.setProperty("/infoMessageWasShown", false);
                } else if (this.evaluationId) {
                    this.anomalyPatterns.initialize('Feature', this.evaluationId);
                    oUIModel.setProperty("/savedItemSelected", true);
                    oUIModel.setProperty("/infoMessageWasShown", false);
                } else if (this.patternId) {
                    this.anomalyPatterns.initialize('Pattern', this.patternId);
                    oUIModel.setProperty("/savedItemSelected", true);
                    oUIModel.setProperty("/infoMessageWasShown", false);
                } else {
                    this.anomalyPatterns.initialize();
                }
            },

            handleNavToAnalysis : function(evt) {
                this.oRouter.navTo("analysis", {}, false);
            },
            navigateToObject : function(objectData) {
                var sURL =
                        sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_CONFIGURATION_PATH + '?Type=' + objectData.Type + '&Name=' + encodeURIComponent(objectData.Name) + '&Namespace=' +
                                encodeURIComponent(objectData.Namespace);
                if (objectData.Id) {
                    sURL = sURL + '&Id=' + objectData.Id;
                }
                var navigationName;
                var param = {};
                switch (objectData.Type) {
                case "Pattern":
                    param = {
                        patternId : objectData.Id
                    };
                    navigationName = "pattern";
                    break;
                case "Scenario":
                    param = {
                        name : encodeURIComponent(objectData.Name),
                        namespace : encodeURIComponent(objectData.Namespace)
                    };
                    navigationName = "scenario";
                    break;
                case "Feature":
                    param = {
                        evaluationId : objectData.Id
                    };
                    navigationName = "evaluation";
                    break;
                }
                this.getComponent().getRouter().navTo(navigationName, param, false);

            },
            handleLinkClicked : function(evt) {
                var bindingContext = evt.getSource().getBindingContext('ObjectList');
                var obj = bindingContext.getObject();
                this.navigateToObject(obj);

            },
            deleteObject : function(oSelectedObject, oControl, Id, oController) {
                var _that = oControl;
                var controller = oController;
                var fnDelete =
                        function(action) {
                            if (action === sap.m.MessageBox.Action.DELETE) {
                                var sURL =
                                        sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_CONFIGURATION_PATH + '?Type=' + oSelectedObject.Type + '&Name=' + encodeURIComponent(oSelectedObject.Name) +
                                                '&Namespace=' + encodeURIComponent(oSelectedObject.Namespace);
                                if (oSelectedObject.Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE ||
                                        oSelectedObject.Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {

                                    sURL = sURL + '&Id=' + Id;
                                    // Ajax
                                }
                                var promise = new sap.secmon.ui.commons.AjaxUtil().deleteJSON(sURL, null, false);
                                promise.fail(function(jqXHR, textStatus, errorThrown) {
                                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, jqXHR.responseText);
                                });
                                promise.done(function(data, textStatus, jqXHR) {
                                    var oData = JSON.parse(data);
                                    var type = _that._getUIText(oData.Type);
                                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, _that.getText("DeletionSuccess_MSG",
                                            [ type, oData.Namespace, oData.Name ]));
                                    _that.initialize();
                                    // try to export
                                    controller.doExportDelete(oSelectedObject);
                                    if (controller) {
                                        controller.refreshData();
                                    }
                                });

                            }

                        };
                var type = _that._getUIText(oSelectedObject.Type);
                sap.m.MessageBox.show(_that.getText("ConfirmDeletion_TXT", [ type, oSelectedObject.Namespace, oSelectedObject.Name ]), {
                    icon : sap.m.MessageBox.Icon.WARNING,
                    title : controller.getCommonText("Delete_TIT"),
                    actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
                    onClose : fnDelete
                });

            },

            doExportDelete : function(patternObject) {
                var that = this;
                var id = patternObject.Id;
                var name = patternObject.Name;
                var namespace = patternObject.Namespace;
                var json = JSON.stringify({
                    Id : id,
                    ObjectType : "AnomalyPattern",
                    ObjectName : name,
                    ObjectNamespace : namespace,
                    Operation : "Delete"
                });
                var ajaxUtil = new sap.secmon.ui.commons.AjaxUtil();
                ajaxUtil.postJson(that.EXPORT_SERVICE, json, {
                    fail : function(status, errorText) {
                        if (status === 400) {
                            sap.m.MessageBox.alert(errorText);
                        }
                    }
                });
            },

            getEmptyObject : function(type) {
                var oModelTmp = new sap.ui.model.json.JSONModel();
                switch (type) {
                case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                    oModelTmp.loadData("/sap/secmon/ui/m/anomaly/ui/defaultPattern.json", null, false);
                    break;
                case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                    oModelTmp.loadData("/sap/secmon/ui/m/anomaly/ui/defaultFeature.json", null, false);
                    break;
                }
                return $.extend({}, oModelTmp.getData().Content[0]);

            },
            addNewObjectToScenario : function(type) {

                var oObjectModel = this.getView().getModel("ObjectModel");
                var objectCopy = this.getEmptyObject(type);

                if (this._isNSOriginal(oObjectModel.getData().Namespace) === true) {
                    objectCopy.Namespace = oObjectModel.getData().Namespace;
                }
                oObjectModel.getData().Content.unshift(objectCopy);
                oObjectModel.refresh(true);
                this.refreshData();
            },

            handleAddNewObjectToScenario : function(oEvent) {
                var data = oEvent.getParameters();
                this.addNewObjectToScenario(data.type);

            },
            _isNSOriginal : function(sNamespace) {
                var result = false;
                if (sNamespace) {
                    var oNamespaceModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.m.anomaly.ui.Constants.C_NAMESPACE_ORIGINAL_IN_SYSTEM, {
                        json : true,
                        defaultCountMode : sap.ui.model.odata.CountMode.Inline
                    });
                    oNamespaceModel.read("/SystemNamespace", {
                        async : false,
                        filters : [ new sap.ui.model.Filter({
                            path : "NameSpace",
                            operator : sap.ui.model.FilterOperator.EQ,
                            value1 : sNamespace
                        }) ],
                        success : function(oData, oResponse) {
                            if (oData.results.length > 0) {
                                result = true;
                            }
                        }
                    });
                }
                return result;
            },

            _save : function(oPayload) {
                var controller = this.getView().getController();

                // set threshold for new occurence to 1 as backend requires this
                // with version SP4 Px
                for (var i = 0; i < oPayload.Content.length; i++) {
                    if (oPayload.Content[i].Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
                        for (var j = 0; j < oPayload.Content[i].PatternProperties.Features.length; j++) {
                            if (oPayload.Content[i].PatternProperties.Features[j].AggregationMethod === sap.secmon.ui.m.anomaly.ui.Constants.C_AGGREGATION_METHOD.RVM) {
                                oPayload.Content[i].PatternProperties.Features[j].Threshold = 1;
                            }
                        }
                    }
                }
                var promise = new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_CONFIGURATION_PATH, JSON.stringify(oPayload));
                promise.fail(function(jqXHR, textStatus, errorThrown) {
                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, controller.getText("Error_TIT"), jqXHR.responseText);
                });
                promise.done(function(data, textStatus, jqXHR) {
                    // get persisted data to have UI
                    // and Backend in sync
                    var oMyModel = controller.getView().getModel("ObjectModel");
                    var oMyModelData = oMyModel.getData();
                    var oData = JSON.parse(data);
                    controller.anomalyPatterns.initialize(oMyModelData.Type, oData.Id, oMyModelData.Name, oMyModelData.Namespace);
                    if (oData.Warning) {
                        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Warning, oData.Warning);
                    }
                    var type = controller.anomalyPatterns._getUIText(oMyModelData.Type);
                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, sap.secmon.ui.commons.Formatter.i18nText(controller.getText("SaveSuccess_MSG"), type,
                            oMyModelData.Namespace, oMyModelData.Name));
                    controller.refreshData.call(controller);
                });
            },
            onSave : function() {
                var _that = this;
                var oData = this.anomalyPatterns.getModel("ObjectModel").getData();
                var callBackFn = function(isSaveOk) {
                    if (isSaveOk === true) {
                        _that._onSaveOk();
                    }
                };
                if (!oData.Name || !oData.Namespace) {
                    this.anomalyPatterns._editNameAndNamespace(callBackFn);
                } else {
                    this._onSaveOk();
                }
            },
            onSaveAs : function() {
                var _that = this;
                var oModel = this.anomalyPatterns.getModel("ObjectModel");
                var oData = oModel.getData();
                var oDataOriginal = $.extend(true, {}, oData);

                if (oData.Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE || oData.Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
                    oData.Content[0].Name = this.getText("CopyOf_TXT") + " " + oData.Name;
                    oData.Content[0].Namespace = null;
                    oData.Content[0].IsNonOriginal = false;
                }
                oModel.setData(oData);
                var callBackFn = function(isSaveOk) {
                    if (isSaveOk === true) {
                        oData.ChangedBy = null;
                        oData.ChangedTimestamp = null;
                        oData.CreatedBy = null;
                        if (oData.Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE || oData.Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
                            oData.CreatedTimestamp = null;
                            oData.Content[0].CreatedBy = null;
                            oData.Content[0].CreatedTimestamp = null;
                            oData.Content[0].ChangedBy = null;
                            oData.Content[0].ChangedTimestamp = null;
                            oData.Content[0].Id = null;
                        }
                        _that._onSaveOk();
                    } else {
                        oModel.setData(oDataOriginal);
                    }
                };
                this.anomalyPatterns._editNameAndNamespace(callBackFn);
            },

            _onSaveOk : function() {
                var _that = this;
                try {
                    var promise;
                    var oAnomalyPatterns = this.anomalyPatterns;
                    oAnomalyPatterns.checkDataConsistency();
                    oAnomalyPatterns.payload = this.anomalyPatterns.getModel("ObjectModel").getData();
                    if (oAnomalyPatterns.payload.Type === 'Scenario') {
                        oAnomalyPatterns.payload.Content.forEach(function(content, idx) {
                            if (oAnomalyPatterns.payload.Namespace !== content.Namespace) {
                            	// Updating name and namespace
                            	oAnomalyPatterns.payload.Namespace = content.Namespace;
                            	oAnomalyPatterns.payload.Name = content.Name;
                            }
                        });

                    }
                    
                    if (oAnomalyPatterns.payload.IsNonOriginal !== true) {                        
                        // check if data reset is needed
                        promise = new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.m.anomaly.ui.Constants.C_EVALUATION_DATA_RESET, JSON.stringify(oAnomalyPatterns.payload));
                        promise.fail(function(jqXHR, textStatus, errorThrown) {
                            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), jqXHR.responseText);
                        });
                        promise.done(function(data, textStatus, jqXHR) {
                            var oDataReset = JSON.parse(data), sConfirmationText;
                            if (oDataReset.required === true && (oDataReset.pattern === undefined || oDataReset.pattern === null)) {
                                // Evaluation is not used in Patttern
                                sConfirmationText = _that.getText("EvalConfirmWithoutPattern");
                                sap.m.MessageBox.confirm(sConfirmationText, {
                                    actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
                                    defaultAction : sap.m.MessageBox.Action.NO,
                                    onClose : function(oAction) {
                                        if (oAction === sap.m.MessageBox.Action.YES) {
                                            _that._save(oAnomalyPatterns.payload);
                                            // clean-up controller member
                                            delete oAnomalyPatterns.payload;
                                        }
                                    }
                                });
                            } else if (oDataReset.required === true && oDataReset.pattern !== undefined && oDataReset.pattern !== null) {
                                // Evaluation is used in Patterns
                                sConfirmationText = _that.getText("EvalConfirmWithPattern");
                                sConfirmationText = sap.secmon.ui.commons.Formatter.i18nText(sConfirmationText, oDataReset.totalAlertCount);
                                var sDetails = "";
                                oDataReset.pattern.forEach(function(pattern) {
                                    sDetails = sDetails + pattern.Name + ": " + pattern.AlertCount + " " + _that.getText("Alerts") + "\n";
                                });
                                sap.m.MessageBox.confirm(sConfirmationText, {
                                    actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
                                    defaultAction : sap.m.MessageBox.Action.NO,
                                    details : sDetails,
                                    onClose : function(oAction) {
                                        if (oAction === sap.m.MessageBox.Action.YES) {
                                            _that._save(oAnomalyPatterns.payload);

                                            // clean-up controller member
                                            delete oAnomalyPatterns.payload;
                                        }
                                    }
                                });
                            } else {
                                _that._save(oAnomalyPatterns.payload);
                                // clean-up controller member
                                delete oAnomalyPatterns.payload;
                            }
                        });                        
                    } else {
                        // persist without saving namespace
                        // check if data reset is needed
                        promise = new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.m.anomaly.ui.Constants.C_EVALUATION_DATA_RESET, JSON.stringify(oAnomalyPatterns.payload));
                        promise.fail(function(jqXHR, textStatus, errorThrown) {
                            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("Error_TIT"), jqXHR.responseText);
                        });
                        promise.done(function(data, textStatus, jqXHR) {
                            var oDataReset = JSON.parse(data), sConfirmationText;
                            if (oDataReset.required === true && (oDataReset.pattern === undefined || oDataReset.pattern === null)) {
                                // Evaluation is not used in Patttern
                                sConfirmationText = _that.getText("EvalConfirmWithoutPattern");
                                sap.m.MessageBox.confirm(sConfirmationText, {
                                    actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
                                    defaultAction : sap.m.MessageBox.Action.NO,
                                    onClose : function(oAction) {
                                        if (oAction === sap.m.MessageBox.Action.YES) {
                                            _that._save(oAnomalyPatterns.payload);
                                            // clean-up controller member
                                            delete oAnomalyPatterns.payload;
                                        }
                                    }

                                });
                            } else if (oDataReset.required === true && oDataReset.pattern !== undefined && oDataReset.pattern !== null) {
                                // Evaluation is used in Patterns
                                sConfirmationText = _that.getText("EvalConfirmWithPattern");
                                sConfirmationText = sap.secmon.ui.commons.Formatter.i18nText(sConfirmationText, oDataReset.totalAlertCount);
                                var sDetails = "";
                                oDataReset.pattern.forEach(function(pattern) {
                                    sDetails = sDetails + pattern.Name + ": " + pattern.AlertCount + " " + _that.getText("Alerts") + "\n";
                                });
                                sap.m.MessageBox.confirm(sConfirmationText, {
                                    actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
                                    defaultAction : sap.m.MessageBox.Action.NO,
                                    details : sDetails,
                                    onClose : function(oAction) {
                                        if (oAction === sap.m.MessageBox.Action.YES) {
                                            _that._save(oAnomalyPatterns.payload);

                                            // clean-up controller member
                                            delete oAnomalyPatterns.payload;
                                        }
                                    }
                                });
                            } else {
                                _that._save(oAnomalyPatterns.payload);
                                // clean-up controller member
                                delete oAnomalyPatterns.payload;
                            }
                        });
                    }
                } catch (e) {
                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, _that.getText("ConsistencyCheck_TIT"), e);
                }
            },
            onDelete : function() {
                var oData = this.anomalyPatterns.getModel("ObjectModel").getData();
                var controller = this.getView().getController();
                if (oData.Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO) {
                    controller.deleteObject.call(controller, oData, controller.anomalyPatterns, null, controller);
                } else {
                    controller.deleteObject.call(controller, oData.Content[0], controller.anomalyPatterns, oData.Content[0].Id, controller);
                }
            },
            onCreateEvaAndAdd2Scen : function() {
                this.addNewObjectToScenario(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE);
            },

            onAddEva2Scen : function() {
                var oFilter = {
                    Type : null,
                    Id : null,
                    ExclusionList : []
                };
                var _that = this;
                var bUTC = this.anomalyPatterns.getModel('applicationContext').getData().UTC;
                var myModel = this.anomalyPatterns.getModel("ObjectModel");
                var aContent = myModel.getProperty("/Content");
                if (aContent && aContent.length > 0) {
                    for (var i = 0; i < aContent.length; i++) {
                        if (aContent[i].Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE) {
                            oFilter.ExclusionList.push(aContent[i].Id);
                        }
                    }
                }
                var oDialog = new sap.m.Dialog({
                    title : _that.getText("SelectEvaluation_TIT"),
                    afterClose : function() {
                        oDialog.destroyContent();
                        oDialog.destroy();
                    },
                    buttons : [ new sap.m.Button({
                        text : _that.getText("BU_FLOD_LBL_Close"),
                        press : function() {
                            oDialog.close();
                        }
                    }) ]
                });
                oDialog.addContent(new sap.secmon.ui.m.anomaly.ui.FeatureExplorer({
                    filter : oFilter,
                    showUTC : bUTC,
                    selectObject : [
                            function(oEvent) {
                                var oData = oEvent.getParameter("data");
                                // read feature data
                                var sURL =
                                        sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_CONFIGURATION_PATH + '?Type=' + oData.Type + '&Name=' + encodeURIComponent(oData.Name) + '&Namespace=' +
                                                encodeURIComponent(oData.Namespace) + '&Id=' + oData.Id;
                                var oModelTmp = new sap.ui.model.json.JSONModel();
                                oModelTmp.loadData(sURL, null, false);
                                var oModelTmpData = oModelTmp.getData();
                                // get content property
                                var aContent = myModel.getProperty("/Content");
                                aContent.unshift(oModelTmpData.Content[0]);
                                myModel.setProperty("/Content", aContent);
                                oEvent.getSource().getParent().close();
                            }, this ],
                    objectListRetrieved : [ function(oEvent) {
                        oEvent.getSource().getParent().setBusy(false);
                    }, this ]
                }));
                oDialog.open();
            },
            onCreatePatAndAdd2Scen : function() {
                this.addNewObjectToScenario(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN);
            },
            onAddPat2Scen : function() {
                var oFilter = {
                    ExclusionList : []
                };
                var _that = this;
                var bUTC = this.anomalyPatterns.getModel('applicationContext').getData().UTC;
                var myModel = this.anomalyPatterns.getModel("ObjectModel");
                var aContent = myModel.getProperty("/Content");
                if (aContent && aContent.length > 0) {
                    for (var i = 0; i < aContent.length; i++) {
                        if (aContent[i].Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN) {
                            oFilter.ExclusionList.push(aContent[i].Id);
                        }
                    }
                }
                var oDialog = new sap.m.Dialog({
                    title : _that.getText("SelectPattern_TIT"),
                    afterClose : function() {
                        oDialog.destroyContent();
                        oDialog.destroy();
                    },
                    buttons : [ new sap.m.Button({
                        text : _that.getText("BU_FLOD_LBL_Close"),
                        press : function() {
                            oDialog.close();
                        }
                    }) ]
                });
                oDialog.addContent(new sap.secmon.ui.m.anomaly.ui.ObjectsExplorer({
                    type : 'Pattern',
                    filter : oFilter,
                    showUTC : bUTC,
                    selectObject : [
                            function(oEvent) {
                                var oData = oEvent.getParameter("data");
                                // read feature data
                                var sURL =
                                        sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_CONFIGURATION_PATH + '?Type=' + oData.Type + '&Name=' + encodeURIComponent(oData.Name) + '&Namespace=' +
                                                encodeURIComponent(oData.Namespace) + '&Id=' + oData.Id;
                                var oModelTmp = new sap.ui.model.json.JSONModel();
                                oModelTmp.loadData(sURL, null, false);
                                var oModelTmpData = oModelTmp.getData();
                                // get content property
                                var aContent = myModel.getProperty("/Content");
                                aContent.unshift(oModelTmpData.Content[0]);
                                myModel.setProperty("/Content", aContent);
                                oEvent.getSource().getParent().close();
                            }, this ],
                    objectListRetrieved : [ function(oEvent) {
                        oEvent.getSource().getParent().setBusy(false);
                    }, this ]
                }));
                oDialog.open();
            }

        });
