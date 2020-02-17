/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.Filter");

$.sap.require("sap.secmon.ui.browse.Subset");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Constants");

/**
 * Custom control to provide a Subset within a Path (of a Workspace). Subset binds its data to the Workspace JSON model, inherited from Workspace
 * 
 * Subset represents a well-defined set that is determined by its filters
 * 
 * @see: singlePathWorkspace.json and UserCreatesUserWorkspace.json
 * 
 * @see Workspace, Path
 */

sap.ui.core.Control.extend("sap.secmon.ui.browse.Filter", {
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

            enabled : {
                type : "boolean",
                defaultValue : true
            }, // enabled or disabled

            luid : "int",
            key : "string",
            displayName : "string",
            description : "string",
            dataType : "string",
            filterOperators : "any", // array

            selectedValues : "any", // object
            // {"operator","searchTerms","exclude"}

            count : "string",
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
            _panel : {
                type : "sap.ui.commons.Panel",
                multiple : false,
                visibility : "hidden"
            },
            _count : {
                type : "sap.secmon.ui.browse.Subset",
                multiple : false,
                visibility : "hidden"
            },
            _panelLayout : {
                type : "sap.ui.commons.layout.MatrixLayout",
                multiple : false,
                visibility : "hidden"
            },
            _layout : {
                type : "sap.ui.layout.VerticalLayout",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            /*
             * activate : {}, deactivate : {},
             */

            edit : {
                sourceBindingPath : "string"
            },

            subsetDeleted : {},

            addFromChartSelection : {
                oParam : "any"
            },

            createPattern : {
                oParam : "any"
            },

            createChart : {
                oParam : "any"
            },

            openCasefile : {
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

    // Workaround so that rerendering triggered if Count is changed
    setCount : function(value) {
        this.setProperty("count", value);
        this._count.setText(sap.secmon.ui.browse.utils.formatByThousands(value, ' '));
    },

    _oFilter : {},
    _oExcluded : {},
    _oOperator : {},
    _oSearchTerms : {},
    _oPanelTitle : {},

    _publishWSChanged : function() {
        sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_WORKSPACE_CHANGED);
    },

    _publishSubsetDeleted : function() {
        sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SUBSET_DELETED);
    },

    exit : function() {
        this._panel.destroy();
    },

    _moveDown : function(oEvent) {

        var sBindingPath = oEvent.getSource().getBindingContext().getPath(); // /paths/1/filters/2
        var aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        var idxPath = parseInt(aFilterItems[0]);
        var idxSubset = parseInt(aFilterItems[1]);

        var oWorkspaceModel = oEvent.getSource().getModel();
        var oWorkspaceData = oEvent.getSource().getModel().getData();

        var oSubset = oWorkspaceData.paths[idxPath].filters.splice(idxSubset, 1);
        oWorkspaceData.paths[idxPath].filters.splice(idxSubset + 1, 0, oSubset[0]);

        var oParam = {};
        oParam.sSubsetId = oWorkspaceData.paths[idxPath].filters[idxSubset].workspaceContext;
        this.fireSubsetChanged(oParam);
        this._publishWSChanged();

        oWorkspaceModel.refresh();
    },

    _moveUp : function(oEvent) {

        var sBindingPath = oEvent.getSource().getBindingContext().getPath(); // /paths/1/filters/2
        var aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        var idxPath = parseInt(aFilterItems[0]);
        var idxSubset = parseInt(aFilterItems[1]);

        var oWorkspaceModel = oEvent.getSource().getModel();
        var oWorkspaceData = oEvent.getSource().getModel().getData();

        var oSubset = oWorkspaceData.paths[idxPath].filters.splice(idxSubset, 1);
        oWorkspaceData.paths[idxPath].filters.splice(idxSubset - 1, 0, oSubset[0]);

        var oParam = {};
        oParam.sSubsetId = oWorkspaceData.paths[idxPath].filters[idxSubset - 1].workspaceContext;
        this.fireSubsetChanged(oParam);
        this._publishWSChanged();

        oWorkspaceModel.refresh();
    },

    _remove : function(oEvent) {

        var thisControl = this;

        var sBindingPath = oEvent.getSource().getBindingContext().getPath(); // /paths/1/filters/2
        var aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        var idxPath = parseInt(aFilterItems[0]);
        var idxSubset = parseInt(aFilterItems[1]);

        var oWorkspaceModel = oEvent.getSource().getModel();
        var oWorkspaceData = oEvent.getSource().getModel().getData();

        var sPathLuid = oWorkspaceData.paths[idxPath].luid;
        var sSubsetLuid = oWorkspaceData.paths[idxPath].filters[idxSubset].luid;

        var sSubset = "Path" + sPathLuid + ".Subset" + sSubsetLuid;        

        function fnCallbackConfirmDelete(bResult) {

            var fnCallbackConfirmOnDeleteCascade;

            if (bResult) {

                var aaDepSubsets2BeDeleted = sap.secmon.ui.browse.utils.findWhereUsedAsRef(true, sSubset, oWorkspaceData);

                var sAffectedArtifactNames = '';
                var aAffectedArtifacts = [];
                if (oWorkspaceData.artifacts) {
                    $.each(oWorkspaceData.artifacts, function(idxA, oArtifact) {
                        $.each(oArtifact.measures, function(idxM, oMeasure) {
                            if (oMeasure.startDatasets) {
                                if (aaDepSubsets2BeDeleted.hasOwnProperty(oMeasure.startDatasets[0].name) || sSubset === oMeasure.startDatasets[0].name) {
                                    aAffectedArtifacts.push(oArtifact);
                                    if (sAffectedArtifactNames.indexOf(oArtifact.name) === -1) {
                                        sAffectedArtifactNames = sAffectedArtifactNames + oArtifact.name + ', ';
                                    }
                                }
                            }
                        });
                    });
                }
                // remove the last ','
                sAffectedArtifactNames = sAffectedArtifactNames.substr(0, sAffectedArtifactNames.length - 2);

                fnCallbackConfirmOnDeleteCascade = function(bResult) {
                    if (bResult) {
                        // invalidate the cache of the current subset + all
                        // its dependent
                        var aaAllDepSubsets = sap.secmon.ui.browse.utils.findDependentSubsets(sSubset, oWorkspaceData);
                        var currSubset;
                        for (currSubset in aaAllDepSubsets) {
                            if (aaAllDepSubsets.hasOwnProperty(currSubset)) {
                                sap.secmon.ui.browse.utils.getController()._oCache.invalidate([ {
                                    context : oWorkspaceData.paths[aaAllDepSubsets[currSubset].pathIdx].context || oWorkspaceData.context,
                                    subsetId : currSubset
                                } ]);
                            }
                        }

                        // delete .chartData per artifact to force BE read
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

                        // delete the affected artifacts
                        $.each(aAffectedArtifacts, function(idxA, oArtifact) {
                            var iArtifactIndex = sap.secmon.ui.browse.utils.getArtifactIdxByLuid(oArtifact.luid, oWorkspaceData);
                            if (iArtifactIndex > -1) {
                                oWorkspaceData.artifacts.splice(iArtifactIndex, 1);
                                // deleted artifacts must be inculded in artifacts2Del node
                                oWorkspaceData.artifacts2Del = oWorkspaceData.artifacts2Del || [];
                                oWorkspaceData.artifacts2Del.push(oArtifact);
                            }
                        });

                        var pathIdx2Del;
                        var subsetIdx2Del;
                        // delete the dependent subsets
                        for (currSubset in aaDepSubsets2BeDeleted) {
                            if (aaDepSubsets2BeDeleted.hasOwnProperty(currSubset)) {
                                pathIdx2Del = sap.secmon.ui.browse.utils.getPathIdxByLuid(aaDepSubsets2BeDeleted[currSubset].pathLuid, oWorkspaceData);
                                subsetIdx2Del = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(aaDepSubsets2BeDeleted[currSubset].subsetLuid, pathIdx2Del, oWorkspaceData);
                                oWorkspaceData.paths[pathIdx2Del].filters.splice(subsetIdx2Del, 1);
                            }
                        }
                        // delete the selected subset
                        pathIdx2Del = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceData);
                        subsetIdx2Del = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(sSubsetLuid, pathIdx2Del, oWorkspaceData);
                        oWorkspaceData.paths[pathIdx2Del].filters.splice(subsetIdx2Del, 1);

                        // this will trigger a re-rendering of UI
                        oWorkspaceModel.refresh(true);
                        thisControl._publishWSChanged();
                        thisControl._publishSubsetDeleted();
                    }
                };

                if ($.isEmptyObject(aaDepSubsets2BeDeleted) && $.isEmptyObject(aAffectedArtifacts)) {
                    oWorkspaceData.paths[idxPath].filters.splice(idxSubset, 1);
                    oWorkspaceModel.refresh(true);
                    sap.secmon.ui.browse.utils.getController()._oCache.invalidate([ {
                        context : oWorkspaceData.paths[idxPath].context || oWorkspaceData.context,
                        subsetId : sSubset
                    } ]);
                    thisControl._publishWSChanged();
                    thisControl._publishSubsetDeleted();
                } else {
                    var sAffectedSubsetNames = '';
                    for ( var currSubset in aaDepSubsets2BeDeleted) {
                        if (aaDepSubsets2BeDeleted.hasOwnProperty(currSubset)) {
                            sAffectedSubsetNames = sAffectedSubsetNames + currSubset + ', ';
                        }
                    }
                    // remove the last ','
                    sAffectedSubsetNames = sAffectedSubsetNames.substr(0, sAffectedSubsetNames.length - 2);                    
                    
                    sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_SSOnDeleteCascade", [ sSubset, sAffectedSubsetNames, sAffectedArtifactNames ]), fnCallbackConfirmOnDeleteCascade,
                        oTextBundle.getText("BU_TIT_SubsetDelete"));
                }
            }
        }

        sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_SubsetDelete", sSubset), fnCallbackConfirmDelete, oTextBundle.getText("BU_TIT_SubsetDelete"));
    },

    init : function() {
        // var oTargetChartModel = new sap.ui.model.json.JSONModel();
        // this.setModel(oTargetChartModel, "TargetChartModel");

        var oOperation = new sap.ui.commons.MenuButton({
            icon : sap.ui.core.IconPool.getIconURI("menu2"),
            tooltip : "{i18n>BU_TOL_SubsetActions}",
            menu : new sap.ui.unified.Menu({
                items : [ new sap.ui.unified.MenuItem({
                    text : "{i18n>BU_LBL_Edit}",
                    tooltip : "{i18n>BU_TOL_Edit}",
                    icon : sap.ui.core.IconPool.getIconURI("edit"),
                    select : [ function(oEvent) {
                        this.fireEdit([ oEvent.getSource().getBindingContext().getPath() ]);
                    }, this ]
                }),

                new sap.ui.unified.MenuItem({
                    text : "{i18n>BU_LBL_Remove}",
                    tooltip : "{i18n>BU_TOL_Remove}",
                    icon : sap.ui.core.IconPool.getIconURI("delete"),
                    select : [ function(oEvent) {
                        this._remove(oEvent);
                    }, this ]
                }),

                new sap.ui.unified.MenuItem({
                    text : "{i18n>BU_LBL_MoveUp}",
                    tooltip : "{i18n>BU_TOL_MoveUp}",
                    icon : sap.ui.core.IconPool.getIconURI("up"),
                    enabled : {
                        path : "dummy", // dummy path
                        formatter : function(sVal) {
                            return true;
                        }
                    },
                    select : [ function(oEvent) {
                        this._moveUp(oEvent);
                    }, this ]
                }),

                new sap.ui.unified.MenuItem({
                    text : "{i18n>BU_LBL_MoveDown}",
                    tooltip : "{i18n>BU_TOL_MoveDown}",
                    icon : sap.ui.core.IconPool.getIconURI("down"),
                    enabled : {
                        path : "dummy", // dummy path
                        formatter : function(sVal) {
                            return true;
                        }
                    },
                    select : [ function(oEvent) {
                        this._moveDown(oEvent);
                    }, this ]
                }) ]
            })
        });

        var isLastSubset = function(oControl) {
            var sPath = oControl.getBindingContext().getPath();
            var aParts = sPath.split('filters/');
            var aFilters = oControl.getModel().getProperty(aParts[0] + 'filters');
            // if this is the last filter no "or" is allowed
            return (!aParts[1] || aFilters.length - 1 === +aParts[1]);
        };

        // arrow down
        this._arrow =
                new sap.ui.core.Icon({
                    size : "1.1rem",
                    src : {
                        path : "or",
                        formatter : function(bValue) {
                            // if this is the last filter no "or" is allowed
                            if (isLastSubset(this)) {
                                bValue = false;
                                var sPath = this.getBindingContext().getPath();
                                this.getModel().setProperty(sPath + "/or", false);
                            }

                            return bValue ? sap.ui.core.IconPool.getIconURI("chain-link") : sap.ui.core.IconPool.getIconURI("arrow-bottom");
                        }
                    },
                    tooltip : {
                        parts : [ {
                            path : "or"
                        }, {
                            path : "isFieldRef"
                        } ],
                        formatter : function(bOR, bIsFieldRef) {
                            return bIsFieldRef || isLastSubset(this) ? oTextBundle.getText("BU_TOL_ANDRel2Next") : (bOR ? oTextBundle.getText("BU_TOL_ORRel2NextHint") : oTextBundle
                                    .getText("BU_TOL_ANDRel2NextHint"));
                        }
                    },
                    press : [ function(oEvent) {
                        var sBindingPath = oEvent.getSource().getBindingContext().getPath(); // /paths/1/filters/2
                        var aPathItems = sBindingPath.split("/paths/");
                        var aFilterItems = aPathItems[1].split("/filters/");
                        var idxPath = parseInt(aFilterItems[0]);
                        var idxSubset = parseInt(aFilterItems[1]);
                        var oWorkspaceData = oEvent.getSource().getModel().getData();

                        // reverse the operator
                        oWorkspaceData.paths[idxPath].filters[idxSubset].or = !oWorkspaceData.paths[idxPath].filters[idxSubset].or;

                        oEvent.getSource().getModel().setData(oWorkspaceData);
                        if (oWorkspaceData.paths[idxPath].filters[idxSubset + 1]) {
                            var oParam = {};
                            oParam.sSubsetId = oWorkspaceData.paths[idxPath].filters[idxSubset + 1].workspaceContext;
                            this.fireSubsetChanged(oParam);
                            this._publishWSChanged();
                        }
                        oEvent.getSource().getModel().refresh(true);
                    }, this ]
                });

        // arrange the layout
        this._panelLayout = new sap.ui.commons.layout.MatrixLayout({
            columns : 3,
            layoutFixed : false,
            widths : [ '15%', '25%', '60%' ]
        });

        this._oFilter = new sap.ui.commons.TextView({
            textAlign : sap.ui.core.TextAlign.Center,
            design : sap.ui.commons.TextViewDesign.H3
        });

        this._oExcluded = new sap.ui.commons.TextView();
        this._oOperator = new sap.ui.commons.TextView();
        this._oSearchTerms = new sap.m.List();

        // Subset count with its set related operations
        this._count = new sap.secmon.ui.browse.Subset({
            count : "{/count}",
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

            openCasefile : [ function(oEvent) {
                this.fireOpenCasefile();

                var oParams = {
                    context : this.getBindingContext()
                };
                sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_OPEN_CASEFILE, oParams);
            }, this ],

            showData : [ function(oEvent) {
                // bubble up the event
                this.fireShowData();

                // trigger in controller
                var oParams = {
                    context : this.getBindingContext()
                };
                sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SHOW_DATA, oParams);
            }, this ],
            showOriginalData : [ function(oEvent) {
                // bubble up the event
                this.fireShowOriginalData();

                // trigger in controller
                var oParams = {
                    context : this.getBindingContext()
                };
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
                var sBindingPath = oEvent.getSource().getBindingContext().getPath(); // /paths/1/filters/2
                var sStartSubset = sap.secmon.ui.browse.utils.path2Id(sBindingPath);
                var idxPath = parseInt(sBindingPath.split("/paths/")[1].split("/filters/")[0]);
                var oWorkspaceData = oEvent.getSource().getModel().getData();
                var oParam = {
                    sSubsetId : sStartSubset,
                    sContext : oWorkspaceData.paths[idxPath].context || oWorkspaceData.context,
                };
                this.fireDisplayBrowsingChart(oParam);
            }, this ]
        });

        // this._count.setModel(this.getModel("TargetChartModel"),
        // "TargetChartModel");

        // this._count.getBinding("count").getPath() -> "/count"
        // this._count.getBindingInfo("count")

        this._panelLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            hAlign : sap.ui.commons.layout.HAlign.Center,
            padding : sap.ui.commons.layout.Padding.End,
            colSpan : 3,
            content : this._oFilter
        }));

        this._panelLayout.createRow(this._oExcluded, this._oOperator, this._oSearchTerms);

        // this._panelLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
        // hAlign : sap.ui.commons.layout.HAlign.Center,
        // // padding : sap.ui.commons.layout.Padding.End,
        // colSpan : 3,
        // content : [ new sap.ui.commons.CheckBox({
        // selected : "{/or}",
        // text : "OR-Relation to Next Subset",
        // select : [ function(oEvent) {
        // }, this ]
        // }) ]
        // }));

        this._oPanelTitle = new sap.ui.core.Title({
            emphasized : true
        });

        this._panel = new sap.ui.commons.Panel({
            showCollapseIcon : false,
            borderDesign : sap.ui.commons.enums.BorderDesign.Box,
            buttons : [ oOperation ],
            content : this._panelLayout,
            title : this._oPanelTitle
        }).addStyleClass("sapEtdFilter");

        this.setAggregation("_arrow", this._arrow);
        this.setAggregation("_panel", this._panel);
        this.setAggregation("_count", this._count);
    },

    renderer : function(oRm, oControl) {

        oRm.renderControl(oControl.getAggregation("_panel"));

        oRm.write("<div class=\"sapEtdSubset\">");
        oRm.renderControl(oControl.getAggregation("_count"));
        oRm.write("</div>");

        oRm.write("<div class=\"sapEtdSubsetArrow\">");
        oRm.renderControl(oControl.getAggregation("_arrow"));
        oRm.write("</div>");
    },

    onBeforeRendering : function() {

        this._panelLayout.setWidth(this.getWidth());

        var oSelectedValues = this.getSelectedValues();

        var that = this;

        if (oSelectedValues.operator === "IN VALUE LIST") {
            oSelectedValues.searchTerms.forEach(function(searchTerm, idx) {
                var oItem = new sap.m.CustomListItem({
                    content : [ new sap.m.Link({
                        text : searchTerm.value,
                        press : function(oEvent) {
                            var oContext = oEvent.getSource().getBindingContext();
                            var operator = oContext.oModel.getProperty(oContext.sPath).valueRange.operator;
                            if (operator === "IN VALUE LIST") {
                                var valuelistId = sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(searchTerm.key);
                                window.open(sap.secmon.ui.m.commons.NavigationService.valuelistURL(valuelistId), '_blank');
                            }
                        }
                    }) ]
                });
                oItem.setTooltip(searchTerm.tooltip);
                that._oSearchTerms.addItem(oItem);
            });
            this._oSearchTerms.addStyleClass("sapEtdFilterItem");
        } else if (this.getDataType() === "ValueTimeStamp" && oSelectedValues.operator === "BETWEEN") {
            var bUTCUsed = this.getModel('applicationContext').getData().UTC;
            oSelectedValues.searchTerms.forEach(function(searchTerm, idx) {
                that._oSearchTerms.addItem(new sap.m.CustomListItem({
                    content : [ new sap.m.Text({
                        text : sap.secmon.ui.commons.Formatter.dateFormatterEx(bUTCUsed, new Date(searchTerm))
                    }) ]
                }));
            });
        } else {
            oSelectedValues.searchTerms.forEach(function(searchTerm, idx) {
                // .setText it's work around for regexp operation
                //e.g text:"/d{1,3}/" in this case brackets will be recognized as binding 
                var oText = new sap.m.Text();
                oText.setText(searchTerm ? searchTerm : sap.secmon.ui.browse.Constants.C_VALUE.NULL);
                that._oSearchTerms.addItem(new sap.m.CustomListItem({
                    content : [ oText ]
                }));
            });
        }

        this._oFilter.setText(this.getDisplayName());
        this._oFilter.setTooltip(this.getDescription());
        this._oExcluded.setText(oSelectedValues.exclude !== undefined && oSelectedValues.exclude === true ? "NOT" : "");
        this._oOperator.setText(oSelectedValues.operator);
        if (oSelectedValues.operator === "IS NULL") {
            var sExcludedText = this._oExcluded.getText();
            if (sExcludedText.length) {
                this._oOperator.setText("IS NOT NULL");
            } else {
                this._oOperator.setText("IS NULL");
            }
            this._panelLayout.removeRow(1);
            this._panelLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
                hAlign : sap.ui.commons.layout.HAlign.Center,
                padding : sap.ui.commons.layout.Padding.Both,
                colSpan : 3,
                content : [ this._oOperator ]
            }));
        }
        this._count.setText(sap.secmon.ui.browse.utils.formatByThousands(this.getCount(), ' '));
        // this._count.setCount(this.getCount());
        this._oPanelTitle.setText("Subset" + this.getLuid());

        var sBindingPath = this.getBindingContext().getPath(); // /paths/1/filters/2
        // find the context from path
        var aPathItems = sBindingPath.split("/paths/");
        var aFilterItems = aPathItems[1].split("/filters/");
        var idxPath = parseInt(aFilterItems[0]);
        var idxSubset = parseInt(aFilterItems[1]);

        var oWorkspaceData = sap.ui.getCore().getModel('WorkspaceModel').getData();

        var bHighlighted = this.getModel().getProperty(sBindingPath + "/highlighted") === true ? true : false;
        this._count.toggleStyleClass("sapEtdSubsetHighlighted", bHighlighted);

        bHighlighted = this.getModel().getProperty(sBindingPath + "/highlightedEmph") === true ? true : false;
        this._count.toggleStyleClass("sapEtdSubsetHighlightedEmph", bHighlighted);

        this._panel.getButtons()[0].getMenu().getItems()[2].setVisible(idxSubset > 0);
        this._panel.getButtons()[0].getMenu().getItems()[3].setVisible(idxSubset < oWorkspaceData.paths[idxPath].filters.length - 1);
    },

    onAfterRendering : function() {

    }

});
