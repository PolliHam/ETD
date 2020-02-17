/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.Path");

$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Filter");
$.sap.require("sap.secmon.ui.browse.Subset");
$.sap.require("sap.secmon.ui.browse.FilterCard");
$.sap.require("sap.secmon.ui.browse.Constants");

/**
 * Custom control to provide a Path within a Workspace, which contains an array of Filters and Subsets. Path binds its data to the Workspace JSON model, inherited from Workspace
 * 
 * @see: singlePathWorkspace.json and UserCreatesUserWorkspace.json
 * 
 * @see Workspace, Filter, Subset
 */
sap.ui.core.Control.extend("sap.secmon.ui.browse.Path", {

    metadata : {
        properties : {
            "width" : {
                type : "sap.ui.core.CSSSize",
                group : "Dimension",
                defaultValue : "100%"
            },
            "height" : {
                type : "sap.ui.core.CSSSize",
                group : "Dimension",
                defaultValue : "100%"
            },
            "data" : {
                type : "any"
            }
        },
        aggregations : {
            _arrow : {
                type : "sap.ui.core.Icon",
                multiple : false,
                visibility : "hidden"
            },
            _toolbar : {
                type : "sap.ui.commons.Toolbar",
                multiple : false,
                visibility : "hidden"
            },
            _toolbar2 : {
                type : "sap.ui.commons.Toolbar",
                multiple : false,
                visibility : "hidden"
            },
            _subset : {
                type : "sap.secmon.ui.browse.Subset",
                multiple : false,
                visibility : "hidden"
            },
            _layout : {
                type : "sap.ui.layout.VerticalLayout",
                multiple : false,
                visibility : "hidden"
            },
            _lowerToolbar : {
                type : "sap.ui.commons.Toolbar",
                multiple : false,
                visibility : "hidden"
            },

        },

        // associations : {
        // charts : {
        // type : "sap.secmon.ui.browse.Chart",
        // multiple : true,
        // singleName : "chart",
        // // visibility : "hidden"
        // },
        // },

        events : {
            add : {},
            createPattern : {
                oParam : "any"
            },
            createChart : {
                oParam : "any"
            },
            displayBrowsingChart : {
                oParam : "any"
            },
            subsetChanged : {
                oParam : "any"
            },
            showData : {},
            showOriginalData : {},
            showAlertGraph : {}
        }
    },

    // popup to select a filter
    _oFilterSelPopup : null,

    _remove : function(oEvent) {

        var thisControl = this;

        var sBindingPath = oEvent.getSource().getBindingContext().getPath(); // /paths/1
        var aPathItems = sBindingPath.split("/paths/");
        var idxPath = parseInt(aPathItems[1]);

        var oWorkspaceModel = oEvent.getSource().getModel();
        var oWorkspaceData = oEvent.getSource().getModel().getData();

        var sPathLuid = oWorkspaceData.paths[idxPath].luid;

        var sPath = "Path" + sPathLuid;

        var aaDepSubsets2BeDeleted = {};
        var aaCurrDepSubsets2BeDeleted = {};
        var currSubset = '';
        var sSubset = '';

        var i = 0;
        var maxLen = 0;

        sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_PathDelete", sPath), fnCallbackConfirm, oTextBundle.getText("BU_TIT_PathDelete"));

        function fnCallbackConfirm(bResult) {
            var fnCallbackConfirmOnDeleteCascade;

            if (bResult) {

                // find out the dependencies of all subsets in this path to
                // other subsets and artifacts
                var sAffectedArtifactNames = '';
                var aAffectedArtifacts = [];

                for (i = 0, maxLen = oWorkspaceData.paths[idxPath].filters.length; i < maxLen; i++) {

                    sSubset = "Path" + sPathLuid + ".Subset" + oWorkspaceData.paths[idxPath].filters[i].luid;
                    aaCurrDepSubsets2BeDeleted = sap.secmon.ui.browse.utils.findWhereUsedAsRef(true, sSubset, oWorkspaceData);

                    if (oWorkspaceData.artifacts) {
                        $.each(oWorkspaceData.artifacts, function(idxA, oArtifact) {
                            $.each(oArtifact.measures, function(idxM, oMeasure) {
                                if (oMeasure.startDatasets) {
                                    if (aaCurrDepSubsets2BeDeleted.hasOwnProperty(oMeasure.startDatasets[0].name) || sSubset === oMeasure.startDatasets[0].name) {
                                        aAffectedArtifacts.push(oArtifact);
                                        if (sAffectedArtifactNames.indexOf(oArtifact.name) === -1) {
                                            sAffectedArtifactNames = sAffectedArtifactNames + oArtifact.name + ', ';
                                        }
                                    }
                                }
                            });
                        });
                    }

                    for (currSubset in aaCurrDepSubsets2BeDeleted) {
                        if (aaCurrDepSubsets2BeDeleted.hasOwnProperty(currSubset)) {
                            if (!aaDepSubsets2BeDeleted.hasOwnProperty(currSubset)) {
                                aaDepSubsets2BeDeleted[currSubset] = {};
                                aaDepSubsets2BeDeleted[currSubset].pathIdx = aaCurrDepSubsets2BeDeleted[currSubset].pathIdx;
                                aaDepSubsets2BeDeleted[currSubset].subsetIdx = aaCurrDepSubsets2BeDeleted[currSubset].subsetIdx;
                                aaDepSubsets2BeDeleted[currSubset].pathLuid = aaCurrDepSubsets2BeDeleted[currSubset].pathLuid;
                                aaDepSubsets2BeDeleted[currSubset].subsetLuid = aaCurrDepSubsets2BeDeleted[currSubset].subsetLuid;
                            }
                        }
                    }
                }
                // remove the last ', '
                sAffectedArtifactNames = sAffectedArtifactNames.substr(0, sAffectedArtifactNames.length - 2);

                if ($.isEmptyObject(aaDepSubsets2BeDeleted) && $.isEmptyObject(aAffectedArtifacts)) {
                    for (i = 0, maxLen = oWorkspaceData.paths[idxPath].filters.length; i < maxLen; i++) {
                        sSubset = "Path" + sPathLuid + ".Subset" + oWorkspaceData.paths[idxPath].filters[i].luid;
                        sap.secmon.ui.browse.utils.getController()._oCache.invalidate([ {
                            context : oWorkspaceData.paths[idxPath].context || oWorkspaceData.context,
                            subsetId : sSubset
                        } ]);
                    }
                    oWorkspaceData.paths.splice(idxPath, 1);
                    oWorkspaceModel.setData(oWorkspaceData);
                    thisControl._publishWSChanged();
                    thisControl._publishPathDeleted();
                } else {
                    var sAffectedSubsetNames = '';
                    for (currSubset in aaDepSubsets2BeDeleted) {
                        if (aaDepSubsets2BeDeleted.hasOwnProperty(currSubset)) {
                            sAffectedSubsetNames = sAffectedSubsetNames + currSubset + ', ';
                        }
                    }
                    // remove the last ', '
                    sAffectedSubsetNames = sAffectedSubsetNames.substr(0, sAffectedSubsetNames.length - 2);

                    sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_PathOnDelCascade", [ sPath, sAffectedSubsetNames, sAffectedArtifactNames ]), fnCallbackConfirmOnDeleteCascade,
                            oTextBundle.getText("BU_TIT_PathDelete"));
                    fnCallbackConfirmOnDeleteCascade = function(bResult) {
                        if (bResult) {
                            // invalidate the cache of all dependent subsets of
                            // the subsets of this path
                            var aaAllDepSubsets = {};
                            for (i = 0, maxLen = oWorkspaceData.paths[idxPath].filters.length; i < maxLen; i++) {
                                sSubset = "Path" + sPathLuid + ".Subset" + oWorkspaceData.paths[idxPath].filters[i].luid;
                                aaAllDepSubsets = sap.secmon.ui.browse.utils.findDependentSubsets(sSubset, oWorkspaceData);
                                for (currSubset in aaAllDepSubsets) {
                                    if (aaAllDepSubsets.hasOwnProperty(currSubset)) {
                                        sap.secmon.ui.browse.utils.getController()._oCache.invalidate([ {
                                            context : oWorkspaceData.paths[aaAllDepSubsets[currSubset].pathIdx].context || oWorkspaceData.context,
                                            subsetId : currSubset
                                        } ]);
                                    }
                                }

                                // delete .chartData per affected artifact to
                                // force BE read
                                if (oWorkspaceData.artifacts) {
                                    $.each(oWorkspaceData.artifacts, function(idxA, oArtifact) {
                                        $.each(oArtifact.measures, function(idxM, oMeasure) {
                                            if (oMeasure.startDatasets) {
                                                if (aaAllDepSubsets.hasOwnProperty(oMeasure.startDatasets[0].name)) {
                                                    delete oArtifact.chartData;
                                                    delete oMeasure.dataSets;
                                                }
                                            }
                                        });
                                    });
                                }
                            }

                            // delete the affected artifacts
                            $.each(aAffectedArtifacts, function(idxA, oArtifact) {
                                var iArtifactIndex = sap.secmon.ui.browse.utils.getArtifactIdxByLuid(oArtifact.luid, oWorkspaceData);
                                if (iArtifactIndex > -1) {
                                    // Add affected artifacts to artifacts2Del in oWorkspaceData
                                    var oArtifact2Del = $.extend(true, {}, oWorkspaceData.artifacts[iArtifactIndex]);
                                    if (oWorkspaceData.artifacts2Del === undefined) {
                                        oWorkspaceData.artifacts2Del = [];
                                    }
                                    oWorkspaceData.artifacts2Del.push(oArtifact2Del);
                                    oWorkspaceData.artifacts.splice(iArtifactIndex, 1);
                                }
                            });

                            // delete the usages first
                            for (currSubset in aaDepSubsets2BeDeleted) {
                                if (aaDepSubsets2BeDeleted.hasOwnProperty(currSubset)) {
                                    var pathIdx2Del = sap.secmon.ui.browse.utils.getPathIdxByLuid(aaDepSubsets2BeDeleted[currSubset].pathLuid, oWorkspaceData);
                                    var subsetIdx2Del = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(aaDepSubsets2BeDeleted[currSubset].subsetLuid, pathIdx2Del, oWorkspaceData);
                                    oWorkspaceData.paths[pathIdx2Del].filters.splice(subsetIdx2Del, 1);
                                }
                            }
                            // delete the selected path
                            oWorkspaceData.paths.splice(idxPath, 1);

                            oWorkspaceModel.setData(oWorkspaceData);
                            thisControl._publishWSChanged();
                            thisControl._publishPathDeleted();
                        }
                    };
                }
            }
        }
    },

    _publishWSChanged : function() {
        sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_WORKSPACE_CHANGED);
    },

    _publishPathDeleted : function() {
        sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_PATH_DELETED);
    },

    init : function() {

        var oTargetChartModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oTargetChartModel, "TargetChartModel");

        this._oFilterSelPopup = null;

        this._layout = new sap.ui.layout.VerticalLayout();
        this._layout.addStyleClass("sapEtdPath");

        this._toolbar = new sap.ui.commons.Toolbar({
            items : [ new sap.ui.commons.TextView({
                design : sap.ui.commons.TextViewDesign.H3
            }), new sap.ui.commons.Button({
                enabled : {
                    path : "WorkspaceModel>/paths",
                    formatter : function(aVals) {
                        return (aVals !== undefined && aVals.length > 1);
                    }
                },
                lite : true,
                icon : sap.ui.core.IconPool.getIconURI("delete"),
                tooltip : "{i18n>BU_TOL_DelPath}",
                press : [ function(oEvent) {
                    this._remove(oEvent);
                }, this ]
            }) ]
        }).addStyleClass("sapEtdPathTitle");

        this._toolbar2 = new sap.ui.commons.Toolbar({
            items : [ new sap.ui.commons.DropdownBox({
                textAlign : sap.ui.core.TextAlign.Center,
                width : "180px",
                items : {
                    path : "BrowsingContextModel>/",
                    template : new sap.ui.core.ListItem({
                        key : "{BrowsingContextModel>name}",
                        text : "{BrowsingContextModel>description}",
                        enabled : "{=${BrowsingContextModel>name} === 'Alert' ? ${applicationContext>/userPrivileges/alertRead} : true }"
                    })
                },
                change : [ function(oEvent) {
                    // TODO: Somehow this model is changed by somebody :-)
                    // so that the keys are not consistent
                    // we reload the data again
                    // @see BrowsingChart.js
                    var oBrowsingChartModel = sap.ui.getCore().getModel("BrowsingChartModel");
                    oBrowsingChartModel.loadData("ui/browsingChart.json", null, false);

                    var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
                    var sBindingPath = oEvent.getSource().getBindingContext().getPath();
                    var sStartSubset = sap.secmon.ui.browse.utils.path2Id(sBindingPath);
                    var oSelectedItem = oEvent.getParameters().selectedItem;
                    oWorkspaceModel.setProperty(sBindingPath + "/context", oSelectedItem.getProperty("key"));
                    var oParam = {
                        sContext : oSelectedItem.getKey(),
                        sSubsetId : sStartSubset,
                    };
                    this.fireDisplayBrowsingChart(oParam);

                    var oWorkspaceData = oWorkspaceModel.getData();
                    var aPathItems = sBindingPath.split("/paths/");
                    var iPathIdx = parseInt(aPathItems[1]);
                    var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(sStartSubset, oWorkspaceData, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_RECORDS_COUNT, null, null);
                    oQuery.verbose = sap.secmon.ui.browse.utils.getController().bDebug;

                    // load log event from warm storage, but only for log event, not for alerts, configchecks and
                    // TODO
                    oQuery.forceWarm = sap.secmon.ui.browse.utils.getController()._bForceWarm;

                    var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery));

                    promise.done(function(response, textStatus, XMLHttpRequest) {
                        oWorkspaceData.paths[iPathIdx].count = response.data[0].COUNT;
                        oWorkspaceModel.setData(oWorkspaceData);
                        oWorkspaceModel.refresh(true);
                    });
                    promise.fail(function(jqXHR, textStatus, errorThrown) {
                        oWorkspaceData.paths[iPathIdx].count = oTextBundle.getText("BrowseCountUnknown");
                        oWorkspaceModel.setData(oWorkspaceData);
                        oWorkspaceModel.refresh(true);
                        var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                        sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                    });
                }, this ]
            }) ]
        });

        var oSubset = new sap.secmon.ui.browse.Subset({
            // count : {
            // path : sBindingPath + "/count"
            // },
            createPattern : [ function(oEvent) {
                // bubble up the event
                var oParams = {
                    rootEvent : oEvent,
                    path : oEvent.getSource().getBindingContext().getPath(),
                    chartFunction : "CreatePattern",
                };
                this.fireCreatePattern(oParams);
            }, this ],
            createChart : [ function(oEvent) {
                // bubble up the event
                var oParams = {
                    rootEvent : oEvent,
                    path : oEvent.getSource().getBindingContext().getPath(),
                    chartFunction : oEvent.getParameter("chartFunction"),
                };
                if (oEvent.getParameter("chartFunction") === "Add2Chart") {
                    oParams.chartLuid = oEvent.getParameter("chartLuid");
                }
                this.fireCreateChart(oParams);
            }, this ],
            showData : [ function(oEvent) {
                // bubble up the event
                // trigger in controller
                var oParams = {
                    context : oEvent.getSource().getBindingContext()
                };
                this.fireShowData();
                sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SHOW_DATA, oParams);
            }, this ],
            showOriginalData : [ function(oEvent) {
                // bubble up the event
                // trigger in controller
                var oParams = {
                    context : oEvent.getSource().getBindingContext()
                };
                this.fireShowOriginalData();
                sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SHOW_ORIGINAL_DATA, oParams);
            }, this ],
            showAlertGraph : [ function(oEvent) {
                // bubble up the event
                this.fireShowAlertGraph();

                // trigger in controller
                var oParams = {
                    context : this.getBindingContext()
                };
                sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SHOW_ALERT_GRAPH, oParams);
            }, this ],
            displayBrowsingChart : [ function(oEvent) {
                var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
                var sBindingPath = oEvent.getSource().getBindingContext().getPath(); // /paths/1
                var sStartSubset = sap.secmon.ui.browse.utils.path2Id(sBindingPath);
                var oParam = {
                    sContext : oWorkspaceModel.getProperty(sBindingPath + "/context") || oWorkspaceModel.getProperty("/context"),
                    sSubsetId : sStartSubset
                };
                this.fireDisplayBrowsingChart(oParam);
            }, this ]
        });

        this._lowerToolbar = new sap.ui.commons.Toolbar({
            items : [ new sap.ui.commons.Link({
                text : "{i18n>BU_TOL_NewSubset}",
                tooltip : "{i18n>BU_TOL_NewSubset}",
                press : [ function(oEvent) {
                    this._addNewSubsetPressed(oEvent);
                    this.fireAdd();

                }, this ]
            }) ],
        });

        // arrow down
        this._arrow = new sap.ui.core.Icon({
            size : "1.1rem",
            src : sap.ui.core.IconPool.getIconURI("arrow-bottom"),
        });

        this.setAggregation("_arrow", this._arrow);
        this.setAggregation("_layout", this._layout);
        this.setAggregation("_toolbar", this._toolbar);
        this.setAggregation("_toolbar2", this._toolbar2);
        this.setAggregation("_subset", oSubset);
        this.setAggregation("_lowerToolbar", this._lowerToolbar);
    },

    renderer : function(oRm, oControl) {

        oRm.write("<div align=\"center\">");
        oRm.renderControl(oControl._toolbar);
        oRm.write("</div>");
        oRm.write("<div align=\"center\">");
        oRm.renderControl(oControl._toolbar2);
        oRm.write("</div>");
        oRm.write("<div class=\"sapEtdSubset\">");
        oRm.renderControl(oControl.getAggregation("_subset"));
        oRm.write("</div>");

        oRm.write("<div class=\"sapEtdSubsetArrow\">");
        oRm.renderControl(oControl._arrow);
        oRm.write("</div>");

        oRm.renderControl(oControl.getAggregation("_layout"));

        oRm.write("<div align=\"center\">");
        oRm.renderControl(oControl._lowerToolbar);
        oRm.write("</div>");
    },

    _handleFilterCardValid : function() {

        if (this._oFilterSelPopup.getOpenState() === sap.ui.core.OpenState.OPEN) {
            this._updateSubsetInWorkspace();
            this._oFilterSelPopup.close();
        }
    },

    _addNewSubsetPressed : function(oEvent) {

        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();
        var sBindingPath = oEvent.getSource().getBindingContext().getPath();
        var aPathItems = sBindingPath.split("/paths/");

        var idxPath = parseInt(aPathItems[1]);
        var idxSubset = oWorkspaceData.paths[idxPath].filters.length;

        var oFilterCard = new sap.secmon.ui.browse.FilterCard({
            mode : "NEW",
            // width : "400px",
            pathIndex : idxPath,
            subsetIndex : idxSubset,
            validationOK : [ function(oEvent) {
                this._handleFilterCardValid();
            }, this ]
        }).addStyleClass("sapEtdFilterCard");

        this._openFilterPopup(oEvent, oFilterCard);
    },

    _editSubsetPressed : function(oEvent) {

        var sBindingPath = oEvent.getParameters()[0];
        var aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        var idxPath = parseInt(aFilterItems[0]);
        var idxSubset = parseInt(aFilterItems[1]);

        var oFilterCard = new sap.secmon.ui.browse.FilterCard({
            mode : "EDIT",
            // width : "400px",
            pathIndex : idxPath,
            subsetIndex : idxSubset,
            validationOK : [ function(oEvent) {
                this._handleFilterCardValid();
            }, this ]
        }).addStyleClass("sapEtdFilterCard");

        this._openFilterPopup(oEvent, oFilterCard);
    },

    _openFilterPopup : function(oEvent, oFilterCard) {

        var oOKButton = new sap.ui.commons.Button({
            text : "{i18n>BU_BUT_OK}",
            enabled : true,
            press : [ function(oEvent) {
                oFilterCard.validateValues();
                this._publishWSChanged();
            }, this ]
        });

        var oCancelButton = new sap.ui.commons.Button({
            text : "{i18n>BU_BUT_Cancel}",
            enabled : true,
            press : [ function() {
                this._oFilterSelPopup.close();
            }, this ]
        });

        if (this._oFilterSelPopup === null) {
            this._oFilterSelPopup = new sap.ui.commons.Dialog({
                modal : true,
                width : "560px",
                title : "{i18n>BU_TIT_CrFilter}",
                buttons : [ oOKButton, oCancelButton ]
            });
            this._oFilterSelPopup.setModel(this.getModel("i18n"), "i18n");
            this._oFilterSelPopup.setModel(this.getModel("applicationContext"), "applicationContext");
            this._oFilterSelPopup.setModel(this.getModel("i18nknowledge"), "i18nknowledge");
        }

        this._oFilterSelPopup.removeAllContent();
        this._oFilterSelPopup.addContent(oFilterCard);
        this._oFilterSelPopup.setInitialFocus(oFilterCard._oFieldSearch.getId());

        if (this._oFilterSelPopup.isOpen()) {
            this._oFilterSelPopup.close();
        } else {
            // sync compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", sap.secmon.ui.browse.utils.getView(), this._oFilterSelPopup);
            this._oFilterSelPopup.open();
        }
    },

    _updateSubsetInWorkspace : function(oNewFilterData) {

        // add SelectedFilterModel to the WorkspaceModel
        // in the current Path to the last position
        // or replace edited filter

        // TODO: in case of chart selection the SelectedFilterModel is not used
        // but the selection is propagated as event parameters
        var oSelectedFilterData;
        if ($.isEmptyObject(oNewFilterData)) {
            var oSelectedFilterModel = sap.ui.getCore().getModel('SelectedFilterModel');
            oSelectedFilterData = $.extend(true, {}, oSelectedFilterModel.getData());
        } else {
            oSelectedFilterData = oNewFilterData;
        }

        this.independentRoleAttributesCheck(oSelectedFilterData);

        var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
        var oWorkspaceData = oWorkspaceModel.getData();

        if (oSelectedFilterData. key === "53CDE6090DC572EEE10000000A4CF109") {
            sap.secmon.ui.browse.utils.checkSubsetTimeRange(oSelectedFilterData.valueRange, oSelectedFilterData.workspaceContext, oWorkspaceData);
        }
        
        // replace the current subset with SelectedFilter data
        var aBuf = oSelectedFilterData.workspaceContext.split(".");
        var aPath = aBuf[0].split("Path");
        var aSubset = aBuf[1].split("Subset");

        var sPathLuid = aPath[1];
        var sSubsetLuid = aSubset[1];

        var iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceData);
        var iSubsetIdx = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(sSubsetLuid, iPathIdx, oWorkspaceData);
        var oParam = {};

        if (iSubsetIdx !== undefined) { // update
            oWorkspaceData.paths[iPathIdx].filters.splice(iSubsetIdx, 1);
            oWorkspaceData.paths[iPathIdx].filters.splice(iSubsetIdx, 0, oSelectedFilterData);

            oParam.sSubsetId = oSelectedFilterData.workspaceContext;
            this.fireSubsetChanged(oParam);
        } else { // insert
            iSubsetIdx = oWorkspaceData.paths[iPathIdx].filters.push(oSelectedFilterData) - 1;

            oParam.sSubsetId = oSelectedFilterData.workspaceContext;
            oParam.sContext = oWorkspaceData.paths[iPathIdx].context || oWorkspaceData.context;
            this.fireDisplayBrowsingChart(oParam);
        }

        sap.secmon.ui.browse.utils.getController()._oCache.getData([ {
            context : oWorkspaceData.paths[iPathIdx].context,
            subsetId : oSelectedFilterData.workspaceContext
        } ], oWorkspaceData);

        var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(oSelectedFilterData.workspaceContext, oWorkspaceData, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_RECORDS_COUNT, null, null);
        oQuery.verbose = sap.secmon.ui.browse.utils.getController().bDebug;
        // load log event from warm storage, but only for log event, not for alerts, configchecks and
        // TODO
        oQuery.forceWarm = sap.secmon.ui.browse.utils.getController()._bForceWarm;

        var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery));

        promise.done(function(response, textStatus, XMLHttpRequest) {
            oWorkspaceData.paths[iPathIdx].filters[iSubsetIdx].count = response.data[0].COUNT;
            oWorkspaceModel.setData(oWorkspaceData);
        });
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            oWorkspaceData.paths[iPathIdx].filters[iSubsetIdx].count = oTextBundle.getText("BrowseCountUnknown");
            oWorkspaceModel.setData(oWorkspaceData);
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });
    },

    independentRoleAttributesCheck : function(oSelectedFilterData){
        if (Object.keys(sap.secmon.ui.browse.Constants.C_ROLE_INDEPENDENT_ATTRIBUTES).indexOf(oSelectedFilterData.key) > -1 ) {
            oSelectedFilterData.roleIndependent = true;
        }
        return oSelectedFilterData;
    },

    onBeforeRendering : function() {

        var oBindingCtx = this.getBindingContext();

        var sBindingPath = oBindingCtx.toString();
        this._layout.bindAggregation("content", sBindingPath + "/filters", new sap.secmon.ui.browse.Filter({
            // context : "{context}",
            // charts : this.getCharts(),
            luid : "{luid}",
            key : "{key}",
            displayName : {
                path: "displayName",
                formatter : function(sDisplayName){
                    return sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(this, sDisplayName, sDisplayName);
                  }
                },
            description :  {
                path: "description",
                formatter : function(sDescription){
                    return sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(this, sDescription, sDescription);
                    }   
                },
            dataType : "{dataType}",
            filterOperators : "{filterOperators}",
            selectedValues : "{valueRange}",
            count : "{count}",
            createPattern : [ function(oEvent) {
                // bubble up the event
                this.fireCreatePattern(oEvent.getParameters());
            }, this ],
            createChart : [ function(oEvent) {
                // bubble up the event
                this.fireCreateChart(oEvent.getParameters());
            }, this ],
            displayBrowsingChart : [ function(oEvent) {
                // bubble up the event
                this.fireDisplayBrowsingChart(oEvent.getParameters());
            }, this ],
            subsetChanged : [ function(oEvent) {
                // bubble up the event
                this.fireSubsetChanged(oEvent.getParameters());
            }, this ],
            edit : [ function(oEvent) {
                this._editSubsetPressed(oEvent);
            }, this ]
        }).setParent(this), false);

        var oTitle = this._toolbar.getItems()[0];
        oTitle.bindProperty("text", {
            path : sBindingPath + "/luid",
            formatter : function(iVal) {
                return "Path" + iVal;
            }
        });

        var oCount = this.getAggregation("_subset");
        oCount.bindProperty("count", {
            path : sBindingPath + "/count",
        });

        var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');

        oCount.toggleStyleClass("sapEtdSubsetHighlighted", oWorkspaceModel.getProperty(sBindingPath).highlighted || false);
        oCount.toggleStyleClass("sapEtdSubsetHighlightedEmph", oWorkspaceModel.getProperty(sBindingPath).highlightedEmph || false);

        var oContext = this._toolbar2.getItems()[0];
        oContext.bindProperty("selectedKey", {
            path : sBindingPath + "/context",
            formatter : function(sVal) {
                return sVal ? sVal : oWorkspaceModel.getProperty("/context");
            }
        });

        oContext.bindProperty("editable", {
            path : sBindingPath + "/filters",
            formatter : function(aVals) {
                // check if artifacts are created from this path
                var sPathLuid = sap.secmon.ui.browse.utils.path2Id(sBindingPath);
                var aArtifactsFound = sap.secmon.ui.browse.utils.getController().getArtifactsByPath(sPathLuid);

                // set this drop down readonly if subsets exist or artifacts
                // have been created from this path
                return aVals.length === 0 && aArtifactsFound.length === 0;
            }
        });
    },

    onAfterRendering : function() {
    }
});
