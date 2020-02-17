/* globals oTextBundle, Promise */
$.sap.declare("sap.secmon.ui.browse.Workspace");

$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Path");
$.sap.require("sap.secmon.ui.browse.TimeRange");
$.sap.require("sap.secmon.ui.browse.Chart");
$.sap.require("sap.secmon.ui.browse.PatternDefinition");
$.sap.require("sap.secmon.ui.browse.WorkspaceExplorer");
$.sap.require("sap.secmon.ui.browse.DataExplorer");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.secmon.ui.browse.Constants");
jQuery.sap.require("sap.ui.model.odata.CountMode");

/**
 * Custom control to provide a Workspace which contains an array of Paths Workspace binds its data to the given JSON model: oWorkspace.setModel() must be called to provide data:
 * 
 * @see: singlePathWorkspace.json and UserCreatesUserWorkspace.json
 * 
 * A Workspace contains multiple Paths, where each Path can have multiple Subsets.
 * @see Path, Subset
 * @memberOf sap.secmon.ui.browse.Workspace
 */
sap.ui.core.Control.extend("sap.secmon.ui.browse.Workspace", {
    metadata : {
        properties : {
            title : {
                type : "string"
            },
            pathWidth : {
                type : "sap.ui.core.CSSSize",
                group : "Dimension",
                defaultValue : "320px"
            },
            pathHeight : {
                type : "sap.ui.core.CSSSize",
                group : "Dimension",
                defaultValue : "240px"
            },
            caching : {
                type : "boolean",
                defaultValue : true
            },
            chart : {
                type : "object"
            },
            rawData : {
                type : "object"
            },
            originalData : {
                type : "object"
            },
            browsingChart : {
                type : "object"
            }
        },

        aggregations : {
            _toolbar1 : {
                type : "sap.ui.commons.Toolbar",
                multiple : false,
                visibility : "hidden"
            },
            _toolbar2 : {
                type : "sap.ui.commons.Toolbar",
                multiple : false,
                visibility : "hidden"
            },
            _layout : {
                type : "sap.ui.layout.HorizontalLayout",
                multiple : false,
                visibility : "hidden"
            },
            _borderlayout : {
                type : "sap.ui.commons.layout.BorderLayout",
                multiple : false,
                visibility : "hidden"
            },
            _footbar : {
                type : "sap.ui.commons.Carousel",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            createPath : {},
            remove : {
                collection : "string",
                key : "string"
            },
            refresh : {},
            publish : {},
            artifactTypeChanged : {
                type : "string",
            }
        }
    },

    /**
     * 
     * @memberOf sap.secmon.ui.browse.Workspace
     */
    _oCreateWorkspaceDialog : undefined,
    _oOpenWorkspaceDialog : undefined,
    _oOpenWorkspaceOverlay : undefined,
    _oSaveWorkspaceDialog : undefined,
    _oSaveAsWorkspaceDialog : undefined,
    _oWSExplorer : undefined,
    _oWSExplorerContainer : undefined,

    _oMultiCntPromise : undefined,
    _bWSChanged : false,
    _bPatternChanged : false,
    _oBorderLayout : undefined,
    _aaChangedPatterns : {},

    _sDisplayedArtifactType : undefined, // Chart|Pattern|BrowsingChart|RawData|OriginalData

    _oTimePeriodPopup : undefined,

    _isOriginalSystem : function() {
        var oWorkspaceData = sap.ui.getCore().getModel("WorkspaceModel").getData();

        // empty workspace
        if (!oWorkspaceData.namespace && !oWorkspaceData.workspaceId) {
            return true;
        }

        // deactivate workspaces that are not original system
        // read original namespaces
        var bOriginal = false;
        var aOriginalNamespaces = sap.ui.getCore().getModel("OriginalNamespacesJSONModel").getData();
        aOriginalNamespaces.some(function(oOriginalNamespace) {
            if (oOriginalNamespace.NameSpace === oWorkspaceData.namespace) {
                bOriginal = true;
                return true;
            }
        });

        return bOriginal;
    },

    init : function() {

        var that = this;

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_ADD_FILTER, function(sChannelId, sEventId, oParams) {
            that._handleFilterAdded(oParams);
        });

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_PATTERN_CHANGED,
                function(sChannelId, sEventId, oParams) {
                    that._handlePatternChanged(oParams);
                });

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_WORKSPACE_CHANGED,
                function(sChannelId, sEventId, oParams) {
                    that._handleWorkspaceChanged();
                });

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_PATH_DELETED, function(sChannelId, sEventId, oParams) {
            that._handleRefreshAfterSSOrPathDelete();
        });

        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SUBSET_DELETED,
                function(sChannelId, sEventId, oParams) {
                    that._handleRefreshAfterSSOrPathDelete();
                });

        this.setModel(sap.ui.getCore().getModel("WorkspaceModel"));
        this.setModel(sap.ui.getCore().getModel("OriginalNamespacesJSONModel"), "NamespacesModel");

        // Workspace list JSON
        var oWorkspaceListJSONModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oWorkspaceListJSONModel, "WorkspaceListJSONModel");

        // Workspace list JSON Private
        var oWSListPrivate = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oWSListPrivate, "WSListPrivate");

        // initialize the layout control
        this._layout = new sap.ui.layout.HorizontalLayout({
            allowWrapping : false
        });

        var oWorkspaceName = new sap.ui.commons.TextView({
            text : {
                parts : [ {
                    path : "/namespace"
                }, {
                    path : "/name"
                } ],

                formatter : function(sNamespace, sName) {
                    return (sNamespace ? sNamespace + ":" + sName : sName);
                }
            },
        }).addStyleClass("sapEtdTitle");

        var oWorkspaceRenameBtn = new sap.ui.commons.Button({
            lite : true,
            icon : sap.ui.core.IconPool.getIconURI("edit"),
            visible : {
                path : "/namespace",
                formatter : function(sNamespace) {
                    return (sNamespace ? true : false) && that._isOriginalSystem();
                }
            },
            tooltip : "{i18n>BU_TOL_WorkspaceRename}",
            press : [ function(oEvent) {
                this._handleWorkspaceRename(oEvent);
            }, this ]
        });

        var oWorkspaceNewAttriBtn = new sap.ui.commons.Button({
            lite : true,
            icon : sap.ui.core.IconPool.getIconURI("request"),
            tooltip : "{i18n>BU_TOL_WSAttributes}",
            visible : "{applicationContext>/userPrivileges/workspaceWrite}",
            press : [ function(oEvent) {
                this._handleWorkspaceNewAttri(oEvent);
            }, this ]
        });

        var oWorkspaceVersionBtn = new sap.ui.commons.Button({
            lite : true,
            text : {
                path : "/version",
                formatter : function(iText) {
                    return "(" + "v" + "." + (iText || 1) + ")";
                }
            },
            visible : {
                path : "/namespace",
                formatter : function(sNamespace) {
                    return (sNamespace ? true : false);
                }
            },
            tooltip : "{i18n>BU_TOL_WSVersion}",
            press : [ function(oEvent) {
                this._handleWorkspaceVersion(oEvent);
            }, this ]
        });

        var oWSTimePeriod = new sap.ui.commons.Label({
            text : {
                path : "/period",
                formatter : function(value) {
                    if (value === undefined) {
                        return;
                    }
                    var oModel = this.getModel("applicationContext");
                    var bUTC = oModel ? oModel.getProperty("/UTC") : true;
                    return sap.secmon.ui.browse.utils.getSelectedPeriod(value, bUTC);
                }.bind(this)
            },
            tooltip : {
                parts : [ {
                    path : "/period"
                }, {
                    path : "/now"
                }, {
                    path : "applicationContext>UTC"
                } ],
                formatter : function(oPeriod, sNow, bUTC) {
                    if (oPeriod === undefined) {
                        return;
                    }
                    if (oPeriod.operator === "=") {
                        var sReferenceNow = sNow ? sap.secmon.ui.commons.Formatter.dateFormatterEx(bUTC, new Date(sNow)) : "";
                        return oTextBundle.getText("BU_TOL_RefTimestamp", [ sap.secmon.ui.browse.utils.getSelectedPeriod(oPeriod, bUTC), sReferenceNow ]);
                    } else {
                        return sap.secmon.ui.browse.utils.getSelectedPeriod(oPeriod, bUTC);
                    }

                }
            },

        });

        var oWSTimePeriodEditBtn = new sap.ui.commons.Button({
            lite : true,
            icon : sap.ui.core.IconPool.getIconURI("edit"),
            tooltip : "{i18n>BU_TOL_ChangeTimePeriod}",
            enabled : {
                path : "/name",
                formatter : function(value) {
                    if (value === "" || value === undefined) {
                        return false;
                    } else {
                        return true;
                    }
                }
            },
            press : [ function(oEvent) {
                this._handleChangeTimePeriod(oEvent);
            }, this ]
        });

        this._toolbar1 = new sap.ui.commons.Toolbar({
            design : "Standard",
            items : [ oWorkspaceName, oWorkspaceVersionBtn, oWorkspaceRenameBtn, oWorkspaceNewAttriBtn ],
            rightItems : [ oWSTimePeriod, oWSTimePeriodEditBtn ]
        });

        this._toolbar2 =
                new sap.ui.commons.Toolbar({
                    design : "Standard",
                    items : [
                            new sap.ui.commons.Button({
                                text : "{i18n>BU_BUT_New}",
                                icon : sap.ui.core.IconPool.getIconURI("create"),
                                tooltip : "{i18n>BU_TOL_CrNewWS}",
                                press : [ function(oEvent) {
                                    this._handleWorkspaceCreate(oEvent);
                                }, this ]
                            }),

                            new sap.ui.commons.Button({
                                text : "{i18n>BU_BUT_Refresh}",
                                icon : sap.ui.core.IconPool.getIconURI("synchronize"),
                                tooltip : "{i18n>BU_TOL_Refresh}",
                                enabled : {
                                    path : "/paths",
                                    formatter : function(aVals) {
                                        return (aVals !== undefined && aVals.length > 0);
                                    }
                                },
                                press : [ function(oEvent) {
                                    // refersh the workspace with counts and
                                    // charts
                                    var sNow = sap.secmon.ui.browse.utils.formatDateTime(new Date());
                                    var oWorkspaceModel = sap.ui.getCore().getModel("WorkspaceModel");
                                    oWorkspaceModel.setProperty("/now", sNow);
                                    this._updateCountsAndChart();

                                    this.fireRefresh();
                                }, this ]
                            }),
                            new sap.ui.commons.Button({
                                text : "{i18n>BU_BUT_Open}",
                                icon : sap.ui.core.IconPool.getIconURI("favorite-list"),
                                tooltip : "{i18n>BU_TOL_OpenWS}",
                                press : [ function(oEvent) {
                                    this._oWSExplorerContainer.destroyContent();
                                    this._oWSExplorerContainer.open();
                                    this._oWSExplorerContainer.setBusy(true);
                                    this._createWorkspaceExplorer();
                                }, this ]
                            }),
                            new sap.ui.commons.Button({
                                enabled : {
                                    path : "/paths",
                                    formatter : function(aVals) {
                                        return (aVals !== undefined && aVals.length > 0);
                                    }
                                },
                                text : "{i18n>BU_BUT_Save}",
                                icon : sap.ui.core.IconPool.getIconURI("save"),
                                tooltip : "{i18n>BU_TOL_SaveCurrWS}",
                                visible : {
                                    parts : [ {
                                        path : "/paths"
                                    }, {
                                        path : "applicationContext>/userPrivileges/workspaceWrite"
                                    }, ],
                                    formatter : function(aVals, bWorkspaceWrite) {
                                        return that._isOriginalSystem() && bWorkspaceWrite;
                                    }
                                },
                                press : [ function(oEvent) {
                                    this._handleWorkspaceSave(oEvent);
                                }, this ]
                            }),
                            new sap.ui.commons.Button({
                                enabled : {
                                    path : "/paths",
                                    formatter : function(aVals) {
                                        return (aVals !== undefined && aVals.length > 0);
                                    }
                                },
                                text : "{i18n>BU_BUT_SaveAs}",
                                icon : sap.ui.core.IconPool.getIconURI("add-favorite"),
                                tooltip : "{i18n>BU_TOL_SaveCurrWSAs}",
                                visible : "{applicationContext>/userPrivileges/workspaceWrite}",
                                press : [ function(oEvent) {
                                    this._handleWorkspaceSaveAs(oEvent);
                                }, this ]
                            }),
                            new sap.ui.commons.ToolbarSeparator(),
                            new sap.ui.commons.Button({
                                // TODO: Move to Path.js
                                text : "{i18n>BU_BUT_AddPath}",
                                enabled : {
                                    path : "/paths",
                                    formatter : function(aVals) {
                                        return (aVals !== undefined && aVals.length > 0);
                                    }
                                },
                                icon : sap.ui.core.IconPool.getIconURI("begin"),
                                tooltip : "{i18n>BU_TOL_CrNewPath}",
                                press : [ function(oEvent) {
                                    this._addPath();
                                    sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_WORKSPACE_CHANGED);
                                }, this ]
                            }),
                            new sap.ui.commons.Button({
                                text : "{i18n>BU_BUT_Import}",
                                icon : sap.ui.core.IconPool.getIconURI("upload"),
                                tooltip : "{i18n>BU_TOL_ImportWS}",
                                visible : "{applicationContext>/userPrivileges/contentUpload}",
                                press : [
                                        function(oEvent) {
                                            function handleFileSelect(evt) {
                                                var f = evt.target.files[0];
                                                if (f.size > 50 * 1024 * 1024) {
                                                    sap.ui.commons.MessageBox.show(sap.secmon.ui.browse.utils.getView().getModel("i18nCommon").getProperty("Commons_FileSizeExceed"),
                                                            sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle.getText("BU_TIT_ImportWS"), sap.ui.commons.MessageBox.Action.OK);
                                                } else if (f && f.type === 'application/json') {
                                                    var r = new FileReader();
                                                    r.onload =
                                                            (function(f) {
                                                                return function(e) {

                                                                    var contents = e.target.result;
                                                                    /**
                                                                     * f.name f.type f.size
                                                                     */
                                                                    try {
                                                                        var oImportedWorkspaceData = JSON.parse(contents);
                                                                        if (oImportedWorkspaceData.workspaceId) {
                                                                            delete oImportedWorkspaceData.workspaceId;
                                                                        }
                                                                        oImportedWorkspaceData.published = '1';
                                                                        if (oImportedWorkspaceData.artifacts) {
                                                                            $.each(oImportedWorkspaceData.artifacts, function(index, oArtifact) {
                                                                                if (oArtifact.artifactId) {
                                                                                    delete oArtifact.artifactId;
                                                                                }
                                                                                if (oArtifact.parentId) {
                                                                                    delete oArtifact.parentId;
                                                                                }
                                                                                oArtifact.shared = false;
                                                                            });
                                                                        }
                                                                        // TODO:
                                                                        // validate
                                                                        // Workspace
                                                                        // Grammar
                                                                        // + KB
                                                                        // GUIDs
                                                                        that._checkChangedWS(function() {
                                                                            that._setWorkspaceData("", oImportedWorkspaceData);
                                                                        });
                                                                    } catch (err) {
                                                                        sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_NoJSON") + ' ' + err, sap.ui.commons.MessageBox.Icon.ERROR,
                                                                                oTextBundle.getText("BU_TIT_ImportWS"), sap.ui.commons.MessageBox.Action.OK);
                                                                    }
                                                                };
                                                            })(f);

                                                    r.readAsText(f);
                                                } else {
                                                    sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_Failed2LoadFiles"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                                            .getText("BU_TIT_ImportWS"), sap.ui.commons.MessageBox.Action.OK);
                                                }
                                            }

                                            if (window.File && window.FileReader && window.FileList && window.Blob) {
                                                var document = oEvent.getSource().getDomRef().ownerDocument;
                                                var oFileInputElement = document.createElement("input");

                                                oFileInputElement.setAttribute("type", "file");
                                                oFileInputElement.setAttribute("id", "fileInput");
                                                oFileInputElement.setAttribute("style", "display: none;");
                                                oFileInputElement.setAttribute("accept", "text/plain, .json");

                                                oFileInputElement.addEventListener('change', handleFileSelect, false);

                                                document.body.appendChild(oFileInputElement);
                                                oFileInputElement.click();
                                                document.body.removeChild(oFileInputElement);
                                            } else {
                                                sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_FileImportNotSup"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                                        .getText("BU_TIT_ImportWS"), sap.ui.commons.MessageBox.Action.OK);
                                            }
                                        }, this ]
                            }) ],
                    rightItems : [ new sap.ui.commons.Button({
                        lite : true,
                        icon : {
                            path : "/fullScreen",
                            formatter : function(value) {
                                if (value) {
                                    return sap.ui.core.IconPool.getIconURI("exit-full-screen");
                                } else {
                                    return sap.ui.core.IconPool.getIconURI("full-screen");
                                }
                            }
                        },
                        tooltip : {
                            path : "/fullScreen",
                            formatter : function(value) {
                                if (value) {
                                    return oTextBundle.getText("BU_TOL_Restore");
                                } else {
                                    return oTextBundle.getText("BU_TOL_Expand");
                                }
                            }
                        },
                        press : [ function(oEvent) {
                            this._toggleFullScreen();
                        }, this ]
                    }) ]
                });

        this._layout.bindAggregation("content", "/paths", function(sId, oContext) {

            var oPath = new sap.secmon.ui.browse.Path(sId, {
                // title : "{name}",
                createPattern : function(oEvent) {
                    that._handleCreatePattern(oEvent.getParameters());
                },
                createChart : function(oEvent) {
                    switch (oEvent.getParameters().chartFunction) {
                    case "CreateChart":
                        that._handleCreateChart(oEvent.getParameters());
                        break;
                    case "RebuildChart":
                        that._handleRebuildChart(oEvent.getParameters());
                        break;
                    case "Add2Chart":
                        that._handleAdd2Chart(oEvent.getParameters());
                        break;
                    }
                },
                displayBrowsingChart : function(oEvent) {
                    var oParams = oEvent.getParameters();
                    that._displayBrowsingChart(oParams.sSubsetId, oParams.sContext, true);

                },
                subsetChanged : function(oEvent) {
                    var oParams = oEvent.getParameters();
                    that._handleRefreshAfterSubsetEdit(oParams.sSubsetId);
                },
            });

            return oPath;
        });

        this._footbar =
                new sap.ui.commons.Carousel({
                    orientation : "horizontal",
                    width : "100%",
                    height : "100px",
                    content : {
                        path : "/artifacts",
                        template : new sap.ui.commons.Panel({
                            showCollapseIcon : false,
                            borderDesign : sap.ui.commons.enums.BorderDesign.Box,
                            title : new sap.ui.core.Title({
                                text : "{name}",
                                tooltip : {
                                    parts : [ {
                                        path : "name"
                                    }, {
                                        path : "measures"
                                    }, ],

                                    formatter : function(sName, aMeasures) {
                                        var sIdx = this.getBindingContext().getPath().split("/artifacts/")[1];
                                        var sTooltip = sIdx + ": " + sName + "\n";
                                        aMeasures.forEach(function(aMeasure, iIdx) {
                                            if (aMeasure.startDatasets) {
                                                sTooltip += aMeasure.startDatasets[0].name + "\n";
                                            }
                                        });
                                        return sTooltip;
                                    }
                                }
                            }),
                            content : [ new sap.ui.commons.layout.MatrixLayout({
                                columns : 2,
                                widths : [ 'auto', 'auto' ],
                                rows : [
                                        new sap.ui.commons.layout.MatrixLayoutRow({
                                            cells : [
                                                    new sap.ui.commons.layout.MatrixLayoutCell({
                                                        rowSpan : 2,
                                                        content : [ new sap.ui.core.Icon({
                                                            size : "3rem",
                                                            color : "#00bfff",
                                                            src : {
                                                                parts : [ {
                                                                    path : "type"
                                                                }, {
                                                                    path : "measures"
                                                                }, ],

                                                                formatter : function(sType, aVals) {
                                                                    if (aVals === undefined) {
                                                                        return;
                                                                    }
                                                                    if (sType === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN) {
                                                                        return "sap-icon://puzzle";
                                                                    }
                                                                    if (aVals.length > 1) {
                                                                        return "sap-icon://multiple-line-chart";
                                                                    } else {
                                                                        return "sap-icon://bar-chart";
                                                                    }
                                                                }
                                                            },
                                                            tooltip : {
                                                                parts : [ {
                                                                    path : "namespace"
                                                                }, {
                                                                    path : "name"
                                                                } ],

                                                                formatter : function(sNamespace, sName) {
                                                                    return sNamespace ? sNamespace + ":" + sName : sName;
                                                                }
                                                            },
                                                            press : [ function(oEvent) {
                                                                var sBindingPath = oEvent.getSource().getBindingContext().getPath();
                                                                var iIndex = parseInt(sBindingPath.split("/artifacts/")[1]);
                                                                this._displayArtifact(iIndex);
                                                            }, this ]
                                                        }) ]
                                                    }),
                                                    new sap.ui.commons.layout.MatrixLayoutCell({
                                                        content : [ new sap.ui.commons.CheckBox({
                                                            text : "{i18n>BU_BUT_ArtifactPublished}",
                                                            tooltip : "{i18n>BU_TOL_ArtifactPublished}",
                                                            change : [
                                                                    function(oEvent) {
                                                                        var that = this;
                                                                        var oCheckboxShared = oEvent.getSource();
                                                                        if (!oEvent.mParameters.checked) {
                                                                            oCheckboxShared.setChecked(!oEvent.mParameters.checked);

                                                                            var sBindingPath = oCheckboxShared.getBindingContext().getPath();
                                                                            var iIndex = parseInt(sBindingPath.split("/artifacts/")[1]);

                                                                            var oWorkspaceModel = sap.ui.getCore().getModel("WorkspaceModel");
                                                                            var oCurrArtifact = oWorkspaceModel.getProperty("/artifacts")[iIndex];

                                                                            if (oCurrArtifact.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN && oCurrArtifact.artifactId &&
                                                                                    oCurrArtifact.shared) {
                                                                                var aPatternsByTrigger = sap.secmon.ui.browse.utils.getPatternsByTrigger(oCurrArtifact.artifactId);
                                                                                if (aPatternsByTrigger.length) {
                                                                                    var sAffectedPatternNames = '';
                                                                                    aPatternsByTrigger.forEach(function(oPattern, iIndex) {
                                                                                        if (oPattern.PatternName) {
                                                                                            sAffectedPatternNames =
                                                                                                    sAffectedPatternNames +
                                                                                                            oTextBundle.getText("BU_MSG_PatternList1", [ oPattern.PatternName,
                                                                                                                    oPattern.WorkspaceName + ' ' + oPattern.WorkspaceNamespace ]) + ', ';
                                                                                        } else {
                                                                                            sAffectedPatternNames =
                                                                                                    sAffectedPatternNames +
                                                                                                            oTextBundle.getText("BU_MSG_PatternList2", oPattern.WorkspaceName + ' ' +
                                                                                                                    oPattern.WorkspaceNamespace) + ', ';
                                                                                        }

                                                                                    });
                                                                                    sAffectedPatternNames = sAffectedPatternNames.substr(0, sAffectedPatternNames.length - 2);
                                                                                    sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_PatternUnpTrigger", [ oCurrArtifact.name,
                                                                                            sAffectedPatternNames ]), function(bRefConfirmed) {
                                                                                        if (bRefConfirmed) {
                                                                                            oCurrArtifact.shared = false;
                                                                                            oCheckboxShared.setChecked(false);
                                                                                            that._setWSChanged(true);
                                                                                        }
                                                                                    }, oTextBundle.getText("BU_TIT_ArtifactUnpublish"));
                                                                                } else {
                                                                                    oCurrArtifact.shared = false;
                                                                                    oCheckboxShared.setChecked(false);
                                                                                    that._setWSChanged(true);
                                                                                }

                                                                            } else {
                                                                                oCurrArtifact.shared = false;
                                                                                oCheckboxShared.setChecked(false);
                                                                                that._setWSChanged(true);
                                                                            }
                                                                        } else {
                                                                            that._setWSChanged(true);
                                                                        }

                                                                    }, this ],

                                                            checked : "{shared}",
                                                        }) ]
                                                    }) ]
                                        }),
                                        new sap.ui.commons.layout.MatrixLayoutRow({
                                            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                                                content : [ new sap.ui.commons.Button({
                                                    text : "{i18n>BU_BUT_DeleteArtifact}",
                                                    tooltip : "{i18n>BU_TOL_DeleteArtifact}",
                                                    icon : "sap-icon://delete",
                                                    lite : true,
                                                    press : [
                                                            function(oEvent) {
                                                                var sBindingPath = oEvent.getSource().getBindingContext().getPath();
                                                                var iIndex = parseInt(sBindingPath.split("/artifacts/")[1]);

                                                                var oWorkspaceModel = sap.ui.getCore().getModel("WorkspaceModel");
                                                                var oWorkspaceData = oWorkspaceModel.getData();

                                                                // confirm
                                                                // deletion
                                                                sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_ArtifactDelete", oWorkspaceData.artifacts[iIndex].name),
                                                                        fnCallbackConfirmDelete, oTextBundle.getText("BU_TIT_ArtifactDelete"));

                                                                function fnCallbackConfirmDelete(bResult) {
                                                                    if (bResult) {
                                                                        /**
                                                                         * prove if it is referenced by other patterns
                                                                         */
                                                                        if (oWorkspaceData.artifacts[iIndex].type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN &&
                                                                                oWorkspaceData.artifacts[iIndex].artifactId) {

                                                                            // check non-tested alerts by pattern
                                                                            var resCheckByAlerts = false;
                                                                            var errorMessage;
                                                                            try {
                                                                                checkPatternOpenAlerts(oWorkspaceData.artifacts[iIndex].artifactId, function(result) {
                                                                                    resCheckByAlerts = result;
                                                                                });
                                                                            } catch (error) {
                                                                                errorMessage =
                                                                                        oTextBundle.getText("BU_MSG_DltPtrFromWSFailedMsg", [ oWorkspaceData.artifacts[iIndex].name,
                                                                                                oWorkspaceData.name ]) +
                                                                                                ": " + error;
                                                                                sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, errorMessage);
                                                                                return;
                                                                            }

                                                                            if (resCheckByAlerts) {

                                                                                // Check Patterns by trigger
                                                                                var aPatternsByTrigger = sap.secmon.ui.browse.utils.getPatternsByTrigger(oWorkspaceData.artifacts[iIndex].artifactId);
                                                                                if (aPatternsByTrigger.length) {
                                                                                    var sAffectedPatternNames = '';
                                                                                    aPatternsByTrigger.forEach(function(oPattern, iIndex) {
                                                                                        if (oPattern.PatternName) {
                                                                                            sAffectedPatternNames =
                                                                                                    sAffectedPatternNames +
                                                                                                            oTextBundle.getText("BU_MSG_PatternList1", [ oPattern.PatternName,
                                                                                                                    oPattern.WorkspaceName + ' ' + oPattern.WorkspaceNamespace ]) + ', ';
                                                                                        } else {
                                                                                            sAffectedPatternNames =
                                                                                                    sAffectedPatternNames +
                                                                                                            oTextBundle.getText("BU_MSG_PatternList2", oPattern.WorkspaceName + ' ' +
                                                                                                                    oPattern.WorkspaceNamespace) + ', ';
                                                                                        }
                                                                                    });
                                                                                    sAffectedPatternNames = sAffectedPatternNames.substr(0, sAffectedPatternNames.length - 2);

                                                                                    sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_PatternDelTrigger", [
                                                                                            oWorkspaceData.artifacts[iIndex].name, sAffectedPatternNames ]), function(bRefConfirmed) {
                                                                                        if (bRefConfirmed) {
                                                                                            fnDeleteArtifact();
                                                                                        }
                                                                                    }, oTextBundle.getText("BU_TIT_ArtifactDelete"));
                                                                                } else {
                                                                                    fnDeleteArtifact();
                                                                                }
                                                                            } else {
                                                                                errorMessage =
                                                                                        oTextBundle
                                                                                                .getText("BU_MSG_DltPtrFromWSFailed", [ oWorkspaceData.artifacts[iIndex].name, oWorkspaceData.name ]);
                                                                                sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, errorMessage);
                                                                            }
                                                                        } else {
                                                                            fnDeleteArtifact();
                                                                        }
                                                                    }
                                                                }

                                                                function checkPatternOpenAlerts(artifactId, callback) {
                                                                    var alertsModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/patterndefinitionToAlerts.xsodata", {
                                                                        json : true,
                                                                        defaultCountMode : sap.ui.model.odata.CountMode.Inline
                                                                    });
                                                                    alertsModel.read("/Alerts", {
                                                                        async : false,
                                                                        filters : [ new sap.ui.model.Filter({
                                                                            path : "PatternId",
                                                                            operator : sap.ui.model.FilterOperator.EQ,
                                                                            value1 : artifactId
                                                                        }), new sap.ui.model.Filter({
                                                                            path : "AlertStatus",
                                                                            operator : sap.ui.model.FilterOperator.NE,
                                                                            value1 : "NO_REACTION_NEEDED_T"
                                                                        }) ],
                                                                        urlParameters : {
                                                                            "$top" : 1,
                                                                            "$select" : "AlertId"
                                                                        },
                                                                        success : function(oData, oResponse) {
                                                                            callback(oData.results.length === 0);
                                                                        },
                                                                        error : function(oError) {
                                                                            throw new Error(oError.message);
                                                                        }
                                                                    });
                                                                }

                                                                function fnDeleteArtifact() {
                                                                    if (oWorkspaceData.artifacts[iIndex].artifactId) {
                                                                        var oArtifact2Del = $.extend(true, {}, oWorkspaceData.artifacts[iIndex]);
                                                                        if (oWorkspaceData.artifacts2Del === undefined) {
                                                                            oWorkspaceData.artifacts2Del = [];
                                                                        }
                                                                        oWorkspaceData.artifacts2Del.push(oArtifact2Del);
                                                                    }
                                                                    oWorkspaceData.artifacts.splice(iIndex, 1);
                                                                    oWorkspaceModel.refresh(true);
                                                                    that._setWSChanged(true);

                                                                    if (oWorkspaceData.artifacts[iIndex - 1]) {
                                                                        that._displayArtifact(iIndex - 1);
                                                                    } else if (!$.isEmptyObject(oWorkspaceData.artifacts)) {
                                                                        that._displayArtifact(0);
                                                                    } else {
                                                                        // last
                                                                        // Subset:
                                                                        that._displayBrowsingChart4LastSubset(true);
                                                                    }
                                                                }
                                                            }, this ]
                                                }) ]
                                            }) ]
                                        }) ]
                            }) ],
                        }),
                    }
                });

        this._borderlayout = new sap.ui.commons.layout.BorderLayout({
            width : "100%",
            height : "100%",
            top : new sap.ui.commons.layout.BorderLayoutArea({
                size : "70px",
                contentAlign : "left;top",
                visible : true,
                content : [ this._toolbar1, this._toolbar2 ]
            }),
            center : new sap.ui.commons.layout.BorderLayoutArea({
                contentAlign : "left",
                visible : true,
                content : [ this._layout ]
            }),
            bottom : new sap.ui.commons.layout.BorderLayoutArea({
                size : "106px",
                contentAlign : "left",
                visible : {
                    path : "/artifacts",
                    formatter : function(aVals) {
                        return (aVals !== undefined && aVals.length > 0);
                    }
                },

                content : [ this._footbar ]
            }),
        });

        this.setAggregation("_borderlayout", this._borderlayout);
        // Container for workspace explorer
        this._oWSExplorerContainer = new sap.ui.commons.Dialog("workspaceExplorer", {
            title : "{i18n>BU_FL_TIT_FWorkspaces}",
            width : "90%",
            height : "80%",
            modal : true
        });
    },

    initialize : function(sFrom, sTo, sSearchId, bLikeRegex, sBrowsingView, aEventsData) {
        var oModel = this.getModel();
        oModel.loadData("ui/defaultWorkspace.json", null, false);
        var sNow = sap.secmon.ui.browse.utils.formatDateTime(new Date());
        oModel.setProperty("/now", sNow);

        var oWorkspaceData = oModel.getData();

        if (aEventsData && sFrom && sTo) {
            var oResultData = this.buildWorkspaceModel(aEventsData, sFrom, sTo);
            oWorkspaceData.period = oResultData.period;
            oWorkspaceData.paths = oResultData.paths;
            oWorkspaceData.name = oTextBundle.getText("BU_LBL_NewWS");
            this._setWorkspaceData("", oWorkspaceData, true);
            var oLastSubset = this.getLastSubset(oWorkspaceData.paths);
            var aDimensions = this.getDimensions(oWorkspaceData.paths);
            this._handleCreatePattern(null, oLastSubset, aDimensions);
        }

        // When search id, "from" and "to" dates are available application initialized based on sherlog parameters
        // Execute Forensic Lab population based on header log Ids
        if (sFrom && sTo && sSearchId) {
            this.populateForensicLab(sSearchId, sFrom, sTo);
        } else if (Array.isArray(sSearchId)) {
            var aPath = [];
            for (var i = 0; i < sSearchId.length; i++) {
                aPath.push({
                    "context" : "Log",
                    "count" : "",
                    "luid" : i + 1,
                    "name" : "Path" + (i + 1),
                    "filters" : [ sSearchId[i] ]
                });
            }
            oWorkspaceData.paths = aPath;
        }

        // Set workspace allowing to navigate Forensic Lab
        this.setWorkspaceData(oWorkspaceData);

    },

    /*
     * Collect workspace name and ensure workspace properties are passed to service
     */
    setWorkspaceData : function(oWorkspaceData) {
        oWorkspaceData.name = oTextBundle.getText("BU_LBL_NewWS");
        this._setWorkspaceData("", oWorkspaceData, true);
    },

    /*
     * Reset the workspace state to the initial
     */
    reset : function() {
    },

    /**
     * An Object will be created containing all needed workspace details and properties Object being used to embedd log header in forensic lab workspace
     * 
     * @param {data} -
     *            Array containg all log header ids
     * @param {sFrom} -
     *            Defines lowest date from logs (passed from Sherlog)
     * @param {sTo} -
     *            Defines highest date from logs (passed form Sherlog)
     * 
     * @returns {oWorkspaceData} - Finalized workspace object
     */
    defineWorkspaceObject : function(data, sFrom, sTo, sKey) {
        if (sKey) {
            var oBrowsingChartModel = sap.ui.getCore().getModel("BrowsingChartModel");
            oBrowsingChartModel.loadData("ui/browsingChartSherlog.json", null, false);
        }
        var oWorkspaceData = {};

        oWorkspaceData.period = {
            "operator" : "BETWEEN",
            "searchTerms" : [ sFrom, sTo ]
        };

        // Static workspace path as
        oWorkspaceData.paths = [ {
            "context" : "Log",
            "count" : "",
            "luid" : 1,
            "name" : "Path1",
            "filters" : []
        } ];

        // Set workspace filters
        // Note: the key refers to the filter field and corresponds to the Log Id Header
        oWorkspaceData.paths[0].filters.push({
            "context" : "Log",
            "count" : "",
            "dataType" : "NCLOB",
            "description" : "Original log data",
            "displayName" : "Log Header Id",
            "filterOperators" : [ "IN" ],
            "isEnumeration" : false,
            "isFieldRef" : 0,
            "key" : "340F1738B612829516007C28A112BE1B",
            "luid" : 1,
            "valueRange" : {
                "operator" : "IN",
                "searchTermRefKeys" : [],
                "searchTerms" : data.headerLogIds
            },
            "workspaceContext" : "Path1.Subset" + 1,
        });
        if (data.roleIndependentAttrValue) {
            var oFilter = {
                "context" : "Log",
                "count" : "",
                "dataType" : "ValueVarChar",
                "description" : sap.secmon.ui.browse.Constants.C_ROLE_INDEPENDENT_ATTRIBUTES[sKey],
                "displayName" : sap.secmon.ui.browse.Constants.C_ROLE_INDEPENDENT_ATTRIBUTES[sKey],
                "filterOperators" : [ "IN" ],
                "isEnumeration" : false,
                "isFieldRef" : 0,
                "key" : sKey,
                "roleIndependent" : true,
                "luid" : 2,
                "valueRange" : {
                    "operator" : "IN",
                    "searchTermRefKeys" : [],
                    "searchTerms" : data.roleIndependentAttrValue
                },
                "workspaceContext" : "Path1.Subset2"
            };
            oWorkspaceData.paths[0].filters.push(oFilter);

        }
        return oWorkspaceData;
    },

    /**
     * Manage the initial population from forensic lab coming from sherlog application. Defines and initiate workspace setup.
     * 
     * @param {sSearchId} -
     *            Cotains temporary id necessary to fetch header log ids from table
     * @param {sFrom} -
     *            Defines lowest date from logs (passed from Sherlog)
     * @param {sTo} -
     *            Defines highest date from logs (passed form Sherlog)
     * @param {sKey} -
     *            Technical key of role-independent attribute
     * @returns {oWorkspaceData} - Finalized workspace object
     */
    populateForensicLab : function(oSearchId, sTo, sFrom) {
        var oController = this;
        var oWorkspaceData;

        // Create payload containing search Id and operation Type
        // The operation Type is necessary to execute the correct method defined in the service
        var request = {
            "operation" : "getLogHeaderIds",
            "searchId" : oSearchId.sSearchId
        };

        // Fire request to backend to get header log ids based on the uuid. The header log ids are used to pre-populate the forensic lab view.
        function createWorkSpaceData() {
            if (oSearchId.sKey) {
                request.attributeKey = oSearchId.sKey;
            }
            return new Promise(function(resolve, reject) {
                $.ajax({
                    type : "POST",
                    url : sap.secmon.ui.browse.Constants.C_SERVICE_PATH,
                    async : false,
                    data : JSON.stringify(request),
                    contentType : "application/json; charset=UTF-8",
                    beforeSend : function(xhr) {
                        xhr.setRequestHeader("X-CSRF-Token", sap.secmon.ui.browse.utils.XCSRFToken);
                    },
                    success : function(data) {
                        resolve(data);
                    },
                    error : function(oError) {
                        sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
                    }.bind(this)
                });
            });
        }
        // Prepare final workspace object and set it accordingly
        createWorkSpaceData().then(function(result) {
            oWorkspaceData = oController.defineWorkspaceObject(result, sTo, sFrom, oSearchId.sKey);
            oController.setWorkspaceData(oWorkspaceData);
        });
    },

    _publishExpandWorkspace : function() {
        sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXPAND_WORKSPACE);
    },

    _publishExitFullScreen : function() {
        sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXIT_FULL_SCREEN);
    },

    _handleFilterAdded : function(aParams) {

        // Highlight the subsets that corresponding to the browsing charts
        this._highlightSubset(this.getModel(), aParams[0].startSubset);
    },

    _handlePatternChanged : function(oParams) {

        var oWorkspaceData = this.getModel().getData();
        var iArtifactIndex = sap.secmon.ui.browse.utils.getArtifactIdxByLuid(oParams.luid, oWorkspaceData);
        var oArtifact = oWorkspaceData.artifacts[iArtifactIndex];
        if (oArtifact.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN && oArtifact.artifactId) {
            this._setPatternChanged(true);
            if (!this._aaChangedPatterns.hasOwnProperty(oArtifact.artifactId)) {
                this._aaChangedPatterns[oArtifact.artifactId] = {};
                this._aaChangedPatterns[oArtifact.artifactId].name = oArtifact.name;
            }
        }
    },

    _handleCreatePattern : function(oParams, sCurrentSubset, aDimensions) {

        var oWorkspaceData = this.getModel().getData();
        var sStartSubset = oParams ? sap.secmon.ui.browse.utils.path2Id(oParams.path) : sCurrentSubset;
        var sPathLuid = sStartSubset.split(".")[0].split("Path")[1];
        var iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceData);
        var sContext = oWorkspaceData.paths[iPathIdx].context || oWorkspaceData.context;

        var oArtifact = {};
        oArtifact.luid = sap.secmon.ui.browse.utils.generateLuid(oWorkspaceData.artifacts);
        oArtifact.period = oWorkspaceData.period;
        oArtifact.type = sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN;
        oArtifact.operation = sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.CREATE_PATTERN;
        oArtifact.namespace = oWorkspaceData.namespace;
        oArtifact.name = "Pattern_" + sap.secmon.ui.browse.utils.generateNameSuffix();
        oArtifact.description = "";
        oArtifact.threshold = 1;
        oArtifact.thresholdOperator = ">=";
        oArtifact.severity = "MEDIUM";
        oArtifact.status = "INACTIVE";
        oArtifact.executionType = sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.SCHEDULED;
        oArtifact.triggerType = sap.secmon.ui.browse.Constants.C_PATTERN_TRIGGER_TYPE.PATTERN;
        oArtifact.triggers = [];
        oArtifact.frequency = 10;
        oArtifact.likelihoodConfidentiality = "N/A";
        oArtifact.likelihoodIntegritySystem = "N/A";
        oArtifact.likelihoodIntegrityData = "N/A";
        oArtifact.likelihoodAvailability = "N/A";
        oArtifact.successConfidentiality = "N/A";
        oArtifact.successIntegritySystem = "N/A";
        oArtifact.successIntegrityData = "N/A";
        oArtifact.successAvailability = "N/A";

        oArtifact.dimensions = aDimensions || [];
        oArtifact.measures = [ {
            luid : sap.secmon.ui.browse.utils.generateLuid([]),
            context : sContext,
            fn : "COUNT",
            distinct : false,
            key : "*",
            name : "*",
            displayName : "Count of " + sContext + " from " + sStartSubset,
            startDatasets : [ {
                name : sStartSubset
            } ]
        } ];

        this._addArtifact(oArtifact);
    },

    _handleCreateChart : function(oParams) {

        var oWorkspaceData = this.getModel().getData();
        var sStartSubset = sap.secmon.ui.browse.utils.path2Id(oParams.path);
        var sPathLuid = sStartSubset.split(".")[0].split("Path")[1];
        var iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceData);
        var sContext = oWorkspaceData.paths[iPathIdx].context || oWorkspaceData.context;

        var oArtifact = {};
        oArtifact.luid = sap.secmon.ui.browse.utils.generateLuid(oWorkspaceData.artifacts);
        oArtifact.period = oWorkspaceData.period;
        oArtifact.type = sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART;
        oArtifact.operation = sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.CREATE_CHART;
        oArtifact.namespace = oWorkspaceData.namespace;
        oArtifact.name = "Chart_" + sap.secmon.ui.browse.utils.generateNameSuffix();
        oArtifact.description = "";
        oArtifact.dimensions = [];
        oArtifact.verbose = sap.secmon.ui.browse.utils.getController().bDebug;

        var sContextName = sContext;
        var oBrowsingContextData = sap.ui.getCore().getModel("BrowsingContextModel").getData();
        if (oBrowsingContextData) {
            $.each(oBrowsingContextData, function(index, oBrowsingContextEntry) {
                if (oBrowsingContextEntry.name === sContext) {
                    sContextName = oBrowsingContextEntry.description;
                    return false;
                }
            });
        }

        oArtifact.measures = [ {
            luid : sap.secmon.ui.browse.utils.generateLuid([]),
            context : sContext,
            fn : "COUNT",
            distinct : false,
            key : "*",
            name : "*",
            displayName : "Count of " + sContextName + " from " + sStartSubset, // TODO:
            startDatasets : [ {
                name : sStartSubset
            } ]
        } ];

        this._addArtifact(oArtifact);
    },

    _handleRebuildChart : function(oParams) {

        var oWorkspaceData = this.getModel().getData();
        var sStartSubset = sap.secmon.ui.browse.utils.path2Id(oParams.path);
        var oChart = this.getChart();
        var oFeedData = oChart.getModel().getData();

        var oArtifact = {};
        oArtifact.luid = sap.secmon.ui.browse.utils.generateLuid(oWorkspaceData.artifacts);
        oArtifact.period = oWorkspaceData.period;
        oArtifact.type = sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART;
        oArtifact.operation = sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.CREATE_CHART;
        oArtifact.namespace = oWorkspaceData.namespace;
        oArtifact.name = "Chart_" + sap.secmon.ui.browse.utils.generateNameSuffix();
        oArtifact.description = "";
        oArtifact.dimensions = JSON.parse(JSON.stringify(oFeedData.dimensions));
        oArtifact.measures = JSON.parse(JSON.stringify(oFeedData.measures));
        oArtifact.verbose = sap.secmon.ui.browse.utils.getController().bDebug;

        $.each(oArtifact.measures, function(index, oMeasure) {
            oMeasure.startDatasets[0].name = sStartSubset;
        });
        this._addArtifact(oArtifact);
    },

    _addArtifact : function(oArtifact) {

        var oWorkspaceModel = this.getModel();
        var oWorkspaceData = oWorkspaceModel.getData();

        if (oWorkspaceData.artifacts === undefined) {
            oWorkspaceData.artifacts = [];
        }
        var iIndex = oWorkspaceData.artifacts.push(oArtifact) - 1;
        this._setWSChanged(true);
        oWorkspaceModel.refresh(true);

        this._displayArtifact(iIndex, true);
    },

    _handleAdd2Chart : function(oParams) {

        var oWorkspaceModel = this.getModel();
        var oWorkspaceData = oWorkspaceModel.getData();
        var sStartSubset = sap.secmon.ui.browse.utils.path2Id(oParams.path);
        var sPathLuid = sStartSubset.split(".")[0].split("Path")[1];
        var iPathIdx = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceData);
        var sContext = oWorkspaceData.paths[iPathIdx].context || oWorkspaceData.context;

        var iArtifactLuid = oParams.chartLuid;
        var iArtifactIndex = sap.secmon.ui.browse.utils.getArtifactIdxByLuid(iArtifactLuid, oWorkspaceData);
        var oArtifact = oWorkspaceData.artifacts[iArtifactIndex];

        var sContextName = sContext;
        var oBrowsingContextData = sap.ui.getCore().getModel("BrowsingContextModel").getData();
        if (oBrowsingContextData) {
            $.each(oBrowsingContextData, function(index, oBrowsingContextEntry) {
                if (oBrowsingContextEntry.name === sContext) {
                    sContextName = oBrowsingContextEntry.description;
                    return false;
                }
            });
        }

        var oNewMeasure = {};
        oNewMeasure = {
            luid : sap.secmon.ui.browse.utils.generateLuid(oArtifact.measures),
            context : sContext,
            fn : "COUNT",
            distinct : false,
            key : "*",
            name : "*",
            displayName : "Count of " + sContextName + " from " + sStartSubset, // TODO:
            startDatasets : [ {
                name : sStartSubset
            } ]
        };
        oArtifact.measures.push(oNewMeasure);
        oWorkspaceModel.refresh(true);

        this._displayArtifact(iArtifactIndex, true);
    },

    _displayArtifact : function(iIndex, bForceBERead) {

        var that = this;

        var oWorkspaceModel = this.getModel();
        var oWorkspaceData = oWorkspaceModel.getData();

        var oArtifactData = oWorkspaceData.artifacts[iIndex];

        var oWorkspaceDataCopy = $.extend(true, {}, oWorkspaceData);

        var aaUsedDatasets = {};
        var aSubsets2Visit = [];
        var reSubset = /Path\d+\.Subset\d+/g;
        $.each(oArtifactData.measures, function(index, oMeasure) {
            reSubset = /Path\d+\.Subset\d+/g;
            if (oMeasure.startDatasets && reSubset.exec(oMeasure.startDatasets[0].name) !== null) {
                oMeasure.dataSets = [];
                aaUsedDatasets = {};
                aSubsets2Visit = [];
                aSubsets2Visit.push(oMeasure.startDatasets[0].name);
                sap.secmon.ui.browse.utils.visitSubset(aSubsets2Visit, oWorkspaceDataCopy, oMeasure, aaUsedDatasets);
            }

            if (!oMeasure.luid) {
                oMeasure.luid = sap.secmon.ui.browse.utils.generateLuid(oArtifactData.measures);
            }
        });

        // Notice: don't remove these two lines below
        // it seems to be a bug in UI5
        if (this.getChart()) {
            this.getChart().destroy();
        }

        var oChart = oArtifactData.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART ? new sap.secmon.ui.browse.Chart({
            refreshMode : {
                mode : 'onDMChange'
            },
            newFilterSelected : [ function(oEvent) {
                this.addSubsetFromChart(oEvent.mParameters);
            }, this ]
        }) : new sap.secmon.ui.browse.PatternDefinition({
            refreshMode : {
                mode : 'onDMChange'
            }
        });

        oChart.setModel(this.getModel("applicationContext"), "applicationContext");

        sap.secmon.ui.browse.utils.isReadOnly(oWorkspaceData.namespace, function(bReadOnly) {
            oArtifactData.execTypeEditable = !bReadOnly;
        });

        this.setChart(oChart);

        this._highlightArtifact(iIndex);

        if (oArtifactData.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN && oArtifactData.artifactId && !this._aaChangedPatterns.hasOwnProperty(oArtifactData.artifactId)) {
            this._reloadPatternConfig(oArtifactData, bForceBERead, fnDisplayArtifact);
        } else {
            fnDisplayArtifact(oArtifactData, bForceBERead);
        }

        function fnDisplayArtifact(oArtifactData, bForceBERead) {

            // check if the referred trigger is available in pattern
            // list
            if (oArtifactData.executionType === sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.TRIGGERED &&
                    oArtifactData.triggerType === sap.secmon.ui.browse.Constants.C_PATTERN_TRIGGER_TYPE.PATTERN && oArtifactData.triggers && oArtifactData.triggers.length) {
                var aFilters = [];
                oArtifactData.triggers.forEach(function(oTrigger, iIndex) {
                    aFilters.push(new sap.ui.model.Filter({
                        path : "Key",
                        operator : sap.ui.model.FilterOperator.EQ,
                        value1 : oTrigger.TriggerName,
                    }));
                });

                var oTriggerModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_ALL_PATTERNS, {
                    json : true,
                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                });

                oTriggerModel.read("/TriggerPattern", {
                    urlParameters : [ "$format=json" ],
                    filters : [ new sap.ui.model.Filter({
                        filters : aFilters,
                        and : false
                    }) ],
                    success : function(oData, oResponse) {
                        var aTriggersDel = [];
                        var aTriggersFound = JSON.parse(oResponse.body).d.results;
                        if (aTriggersFound.length !== aFilters.length) {
                            oArtifactData.triggers.forEach(function(oTrigger, iIndex) {
                                if (oResponse.body.indexOf(sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(oTrigger.TriggerName)) < 0) {
                                    aTriggersDel.push(iIndex);
                                }
                            });
                            // remove the triggers from artifact's
                            // trigger list
                            for (var i = aTriggersDel.length - 1; i >= 0; i--) {
                                oArtifactData.triggers.splice(aTriggersDel[i], 1);
                            }
                            oChart.getModel().refresh(true);
                        }
                    },
                    error : function(oError) {
                        sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
                    }
                });

            }

            oChart.getModel().setData(oArtifactData);
            oChart.setArtifactLuid(oArtifactData.luid);

            // load the trigger model
            if (oChart.loadTriggersModel) {
                oChart.loadTriggersModel();
            }

            if (bForceBERead || $.isEmptyObject(oArtifactData.chartData)) {
                oChart.handleFeedsChanged();
            } else {
                oChart.newDataAvailable();
            }

            that._reloadDimsAndMeasModels(oArtifactData);

            that.fireArtifactTypeChanged({
                type : oArtifactData.type
            });
            that._sDisplayedArtifactType = oArtifactData.type;
        }
    },

    _reloadDimsAndMeasModels : function(oArtifactData) {

        var oWorkspaceData = this.getModel().getData();

        var sArtifactContext = "";
        var sArtifactStartSubset = "";
        $.each(oArtifactData.measures, function(idx, oMeasure) {
            if (!oMeasure.reference) {
                sArtifactContext = oMeasure.context;
                sArtifactStartSubset = oMeasure.startDatasets[0].name;
                return false;
            }
        });

        var oDimensionsModel = sap.ui.getCore().getModel('DimensionsModel');
        var oMeasuresModel = sap.ui.getCore().getModel('MeasuresModel');
        var oDimsData, oMeasData;

        // TODO oDimensionsModel has no data
        sap.secmon.ui.browse.utils.getController()._oCache.getData([ {
            context : sArtifactContext,
            subsetId : sArtifactStartSubset
        } ], oWorkspaceData).done(function(response, textStatus, XMLHttpRequest) {
            var oBackendata = JSON.parse(JSON.stringify(response));
            if (!(oDimensionsModel.getProperty("/data") && (oBackendata.data.length + 1 === oDimensionsModel.getProperty("/data").length))) {
                oDimsData = [ {
                    "displayName" : "",
                    "key" : "",
                    "dataType" : "",
                    "filterOperators" : []
                } ].concat(oBackendata.data);
                var iToDelete;
                oDimsData.forEach(function(dim, i) {
                    // key for "Event,Original Message"
                    if (dim.key === '566CDFB06EFAAC24E10000000A4CF109') {
                        iToDelete = i;
                        return false;
                    }
                });
                if (iToDelete) {
                    oDimsData.splice(iToDelete, 1);
                }
                oDimensionsModel.setProperty("/data", oDimsData);

                oMeasData = [ {
                    "displayName" : "*",
                    "description" : "All",
                    "key" : "*",
                    "dataType" : "",
                    "filterOperators" : []
                } ].concat(oBackendata.data);
                oMeasuresModel.setProperty("/data", oMeasData);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
            sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
        });
    },

    _reloadPatternConfig : function(oArtifact, bForceBERead, fnDisplayCallback) {

        var oPatternConfigModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_PATTERNCONFIG_PATH, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oPatternConfigModel.read("/PatternConfig(X'" + oArtifact.artifactId + "')", {
            success : function(data) {
                // set each pattern config in the workspace model
                oArtifact.executionOutput = data.ExecutionOutput;
                oArtifact.threshold = data.Threshold;
                oArtifact.thresholdOperator = data.ThresholdOperator;
                oArtifact.severity = data.Severity;
                oArtifact.frequency = data.Frequency;
                oArtifact.status = data.Status;
                oArtifact.likelihoodConfidentiality = data.LikelihoodConfidentiality;
                oArtifact.likelihoodIntegritySystem = data.LikelihoodIntegritySystem;
                oArtifact.likelihoodIntegrityData = data.LikelihoodIntegrityData;
                oArtifact.likelihoodAvailability = data.LikelihoodAvailability;
                oArtifact.successConfidentiality = data.SuccessConfidentiality;
                oArtifact.successIntegritySystem = data.SuccessIntegritySystem;
                oArtifact.successIntegrityData = data.SuccessIntegrityData;
                oArtifact.successAvailability = data.SuccessAvailability;

                // due to trigger-based execution
                switch (data.ExecutionType) {
                case undefined:
                case sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.SCHEDULED:
                    oArtifact.executionType = sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.SCHEDULED;
                    oArtifact.triggerType = sap.secmon.ui.browse.Constants.C_PATTERN_TRIGGER_TYPE.PATTERN;
                    break;
                case sap.secmon.ui.browse.Constants.C_PATTERN_TRIGGER_TYPE.PATTERN:
                case sap.secmon.ui.browse.Constants.C_PATTERN_TRIGGER_TYPE.EVENT:
                    oArtifact.executionType = sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.TRIGGERED;
                    oArtifact.triggerType = data.ExecutionType;
                    break;
                }
                oArtifact.triggers = [];

                if (oArtifact.executionType !== sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.SCHEDULED) {
                    oPatternConfigModel.read("/PatternConfig(X'" + oArtifact.artifactId + "')/Triggers", {
                        success : function(data) {
                            data.results.forEach(function(oResult, idx) {
                                oArtifact.triggers.push({
                                    ChangeTimestamp : oResult.ChangeTimestamp,
                                    Namespace : oResult.Namespace,
                                    PatternId : oResult.PatternId,
                                    TriggerName : oResult.TriggerName,
                                    TriggerType : oResult.TriggerType
                                });
                            });

                            fnDisplayCallback.call(this, oArtifact, bForceBERead);
                        },
                        error : function() {
                            // TODO: Inconsistent Workspace
                        }
                    });
                } else {
                    fnDisplayCallback.call(this, oArtifact, bForceBERead);
                }
            },
            error : function(oError) {
                sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
            }
        });
    },

    _displayBrowsingChart : function(sStartSubset, sContext, bForceBERead) {

        var oPreviousChart = this.getChart();
        if (oPreviousChart) {
            oPreviousChart.destroy();
            oPreviousChart = null;
        }

        this.fireArtifactTypeChanged({
            type : sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.BROWSINGCHART
        // 'BrowsingChart'
        });

        this._sDisplayedArtifactType = sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.BROWSINGCHART;
        sap.ui.getCore().getModel('WorkspaceModel').setProperty("/browsingView", this._sDisplayedArtifactType);

        this.getBrowsingChart().display(sStartSubset, sContext, bForceBERead);

        // Highlight the subsets that corresponding to the browsing charts
        var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
        this._highlightSubset(oWorkspaceModel, sStartSubset);
    },

    _highlightSubset : function(oWorkspaceModel, sStartSubset) {
        // reset the highlighting
        this._unHighlightAllArtifacts();
        oWorkspaceModel.setProperty("/selectedSubsetId", sStartSubset);

        // Highlight the subsets that corresponding to the browsing charts
        var oWorkspaceData = oWorkspaceModel.getData();
        var aReferredSubset = sStartSubset.split(".");
        var sLidPath = aReferredSubset[0];
        var sLidSubset = aReferredSubset.length > 1 ? aReferredSubset[1] : undefined;

        var _idxPath = sap.secmon.ui.browse.utils.getPathIdxByLuid(sLidPath.split("Path")[1], oWorkspaceData);
        var _idxSubset = sLidSubset ? sap.secmon.ui.browse.utils.getSubsetIdxByLuid(sLidSubset.split("Subset")[1], _idxPath, oWorkspaceData) : -1;
        this.markHighlightedSubset(oWorkspaceModel, _idxPath, _idxSubset);
        // Hightlight the first subset with emphasis
        oWorkspaceModel.setProperty("/paths/" + _idxPath + (sLidSubset ? "/filters/" + _idxSubset : "") + "/highlightedEmph", true);
        oWorkspaceModel.refresh(true);
    },

    _toggleFullScreen : function() {
        if (this.getModel().getProperty("/fullScreen")) {
            this.getModel().setProperty("/fullScreen", false);
            this._publishExitFullScreen();
        } else {
            this.getModel().setProperty("/fullScreen", true);
            this._publishExpandWorkspace();
        }
    },

    _handleWorkspaceChanged : function() {
        // this._abortMutliCount();
        this._setWSChanged(true);
    },

    _setWSChanged : function(bChanged) {
        this._bWSChanged = bChanged;
    },

    _setPatternChanged : function(bChanged) {
        this._bPatternChanged = bChanged;
    },

    _getWSChanged : function() {
        return this._bWSChanged;
    },

    _getPatternChanged : function() {
        return this._bPatternChanged;
    },

    _checkChangedWS : function(ok, no) {

        var that = this;

        if (this._getWSChanged() === true) {
            sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_Confirm_Discard"), function(bIsOK) {
                if (bIsOK === true) {
                    ok.call();
                    that._setWSChanged(false);
                    that._setPatternChanged(false);
                } else if (no) {
                    no.call();
                }

            }, oTextBundle.getText('BU_Confirm_Msg_Title'));

        } else {
            ok.call();
        }

    },

    _abortMutliCount : function() {
        if (this._oMultiCntPromise !== undefined) {
            this._oMultiCntPromise.abort();
        }
    },

    _handleRefreshAfterSubsetEdit : function(sStartSubset) {

        var oWorkspaceData = this.getModel().getData();

        // invalidate the cache of the current subset + all its
        // dependent
        var aaDepSubsets = sap.secmon.ui.browse.utils.findDependentSubsets(sStartSubset, oWorkspaceData);
        for ( var currSubset in aaDepSubsets) {
            if (aaDepSubsets.hasOwnProperty(currSubset)) {
                sap.secmon.ui.browse.utils.getController()._oCache.invalidate([ {
                    context : oWorkspaceData.paths[aaDepSubsets[currSubset].pathIdx].context || oWorkspaceData.context,
                    subsetId : currSubset
                } ]);
            }
        }

        // delete .chartData per artifact to force BE read
        if (oWorkspaceData.artifacts) {
            $.each(oWorkspaceData.artifacts, function(idxA, oArtifact) {
                $.each(oArtifact.measures, function(idxM, oMeasure) {
                    if (oMeasure.startDatasets) {
                        if (aaDepSubsets.hasOwnProperty(oMeasure.startDatasets[0].name)) {
                            delete oArtifact.chartData;
                            delete oMeasure.dataSets;
                        }
                    }
                });
            });
        }

        // update the count of the affected subsets
        this._updateRecordsCount(aaDepSubsets);

        // refresh current BrowsingChart
        switch (this._sDisplayedArtifactType) {
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.BROWSINGCHART:
            var sCurrentSubset = this.getBrowsingChart().getStartSubset();
            var sContext = this.getBrowsingChart().getContext();
            if (aaDepSubsets.hasOwnProperty(sCurrentSubset)) {
                this.getBrowsingChart().display(sCurrentSubset, sContext, true);
            }
            break;
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART:
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN:
            // refresh the currently displayed artifact if
            // affected
            var oChart = this.getChart();
            if (oChart) {
                var iArtifactLuid = oChart.getArtifactLuid();
                var iArtifactIndex = sap.secmon.ui.browse.utils.getArtifactIdxByLuid(iArtifactLuid, oWorkspaceData);
                this._displayArtifact(iArtifactIndex);
            }
            break;
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.RAWDATA:
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.ORIGINALDATA:
            break;
        }

    },

    _handleRefreshAfterSSOrPathDelete : function() {

        var oWorkspaceData = this.getModel().getData();

        if (this._sDisplayedArtifactType === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.BROWSINGCHART) {
            var sBrowsingChartSubset = this.getBrowsingChart().getStartSubset();
            var sBrowsingChartContext = this.getBrowsingChart().getContext();
            // check whether displayed subset still exists in workspace
            // if yes => refresh it,
            // if no => display a browsing chart of the last subset/path

            var bFound = false;
            for (var i = 0, imaxLen = oWorkspaceData.paths.length; i < imaxLen; i++) {
                for (var j = 0, jmaxLen = oWorkspaceData.paths[i].filters.length; j < jmaxLen; j++) {
                    var sSubset = "Path" + oWorkspaceData.paths[i].luid + ".Subset" + oWorkspaceData.paths[i].filters[j].luid;
                    if (sSubset === sBrowsingChartSubset) {
                        bFound = true;
                        break;
                    }
                }
            }

            if (bFound) {
                this.getBrowsingChart().displayBrowsingChart(sBrowsingChartSubset, sBrowsingChartContext, true);
                this._updateRecordsCount();
            } else {
                this._displayBrowsingChart4LastSubset(true);
            }
            // TODO
        } else if (this._sDisplayedArtifactType === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.RAWDATA) {
        } else if (this._sDisplayedArtifactType === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.ORIGINALDATA) {
        } else { // refresh the currently displayed
            // artifact if
            // affected
            var oChart = this.getChart();
            if (oChart) {
                var iArtifactLuid = oChart.getArtifactLuid();
                var iArtifactIndex = sap.secmon.ui.browse.utils.getArtifactIdxByLuid(iArtifactLuid, oWorkspaceData);
                if (iArtifactIndex > -1) {
                    this._displayArtifact(iArtifactIndex);
                } else if (oWorkspaceData.artifacts.length > 0) {
                    this._displayArtifact(0);
                } else {
                    this._displayBrowsingChart4LastSubset(true);
                }
            }
        }
    },

    _displayBrowsingChart4LastSubset : function(bForceBERead) {

        var oWorkspaceData = this.getModel().getData();

        if (!$.isEmptyObject(oWorkspaceData.paths)) {
            var iLastPathIdx = oWorkspaceData.paths.length - 1;
            var sStartSubset = "Path" + oWorkspaceData.paths[iLastPathIdx].luid;
            if (!$.isEmptyObject(oWorkspaceData.paths[iLastPathIdx].filters)) {
                var iLastSubsetIdx = oWorkspaceData.paths[iLastPathIdx].filters.length - 1;
                sStartSubset = sStartSubset + ".Subset" + oWorkspaceData.paths[iLastPathIdx].filters[iLastSubsetIdx].luid;
            }
            this._displayBrowsingChart(sStartSubset, (oWorkspaceData.paths[iLastPathIdx].context || oWorkspaceData.context), bForceBERead);
        }
    },

    _unHighlightAllArtifacts : function() {

        $.each(this._footbar.getContent(), function(idx, oPanel) {
            oPanel.toggleStyleClass("sapEtdArtifactHighlighted", false);
        });

        var oWorkspaceData = this.getModel().getData();
        $.each(oWorkspaceData.paths, function(iPath, oPath) {
            $.each(oPath.filters, function(iSubset, oSubset) {
                delete oSubset.highlighted;
                delete oSubset.highlightedEmph;
            });
            delete oPath.highlighted;
            delete oPath.highlightedEmph;
        });
    },

    // mark the subsets highlighted recursively
    markHighlightedSubset : function(oWorkspaceModel, idxPath, idxSubset) {
        var sPath;
        idxSubset = isNaN(idxSubset) ? -1 : idxSubset;
        for (var isubset = idxSubset; isubset >= -1; isubset--) {
            sPath = "/paths/" + idxPath + (isubset > -1 ? "/filters/" + isubset : "");
            oWorkspaceModel.setProperty(sPath + "/highlighted", true);
            // recursively find the references
            var oSubset = oWorkspaceModel.getProperty(sPath);
            if (oSubset.isFieldRef > 0) {
                var aReferredSubset = oSubset.valueRange.searchTerms[0].split(".");
                var oWorkspaceData = oWorkspaceModel.getData();
                var _idxPath = sap.secmon.ui.browse.utils.getPathIdxByLuid(aReferredSubset[0].split("Path")[1], oWorkspaceData);
                var _idxSubset = aReferredSubset.length > 1 ? sap.secmon.ui.browse.utils.getSubsetIdxByLuid(aReferredSubset[1].split("Subset")[1], _idxPath, oWorkspaceData) : -1;
                this.markHighlightedSubset(oWorkspaceModel, _idxPath, _idxSubset);

                // remove the root
                // oWorkspaceModel.setProperty("Path" + idxPath + "/highlighted", false);
            }
        }
    },

    _highlightArtifact : function(iIndex) {

        $.each(this._footbar.getContent(), function(idx, oPanel) {
            oPanel.toggleStyleClass("sapEtdArtifactHighlighted", false);
        });
        this._footbar.getContent()[iIndex].toggleStyleClass("sapEtdArtifactHighlighted", true);

        var oWorkspaceModel = this.getModel();
        var oWorkspaceData = oWorkspaceModel.getData();
        var oArtifactData = oWorkspaceData.artifacts[iIndex];

        // reset highlighted flags
        $.each(oWorkspaceData.paths, function(iPath, oPath) {
            $.each(oPath.filters, function(iSubset, oSubset) {
                delete oSubset.highlighted;
                delete oSubset.highlightedEmph;
            });
            delete oPath.highlighted;
            delete oPath.highlightedEmph;
        });

        var that = this;
        $.each(oArtifactData.measures, function(idx, oMeasure) {
            var idxPath;
            if (oMeasure.startDatasets && oMeasure.startDatasets[0].name !== 'Workspace') {
                var aBuf = oMeasure.startDatasets[0].name.split('.');
                var aPath = aBuf[0].split("Path");
                if (aBuf[1]) {
                    var aSubset = aBuf[1].split("Subset");
                    idxPath = sap.secmon.ui.browse.utils.getPathIdxByLuid(aPath[1], oWorkspaceData);
                    var idxSubset = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(aSubset[1], idxPath, oWorkspaceData);
                    // hightlight the subset of this path
                    // and its referred subsets (recursively)
                    that.markHighlightedSubset(oWorkspaceModel, idxPath, idxSubset);
                    oWorkspaceModel.setProperty("/paths/" + idxPath + "/filters/" + idxSubset + "/highlightedEmph", true);
                    oWorkspaceModel.setProperty("/selectedSubsetId", oMeasure.startDatasets[0].name);
                } else { // path should be highlighted
                    idxPath = sap.secmon.ui.browse.utils.getPathIdxByLuid(aPath[1], oWorkspaceData);
                    oWorkspaceModel.setProperty("/paths/" + idxPath + "/highlightedEmph", true);
                }
            }
        });
    },

    _getArtifactIndexById : function(sArtifactId) {
        var oWorkspaceData = this.getModel().getData();
        var iSelectedIndex = 0;

        if (oWorkspaceData.artifacts) {
            $.each(oWorkspaceData.artifacts, function(idx, oArtifact) {
                if (oArtifact.artifactId === sArtifactId) {
                    iSelectedIndex = idx;
                    return false;
                }
            });
        }
        return iSelectedIndex;
    },

    _setWorkspaceData : function(sWorkspaceId, oSerializedData, bUpdateCountsAndChart, sArtifactId, iArtifactIndex) {

        // invalidate global cache
        sap.secmon.ui.browse.utils.getController()._oCache.invalidate();

        this._abortMutliCount();

        var oWorkspaceModelData = {};
        if (oSerializedData.workspace !== undefined) {
            oWorkspaceModelData = oSerializedData.workspace;
        } else {
            oWorkspaceModelData = oSerializedData;
        }
        oWorkspaceModelData.workspaceId = sWorkspaceId;

        if (oWorkspaceModelData.artifacts === undefined) {
            oWorkspaceModelData.artifacts = [];
        }

        $.each(oWorkspaceModelData.artifacts, function(index, oArtifact) {
            oArtifact.period = oWorkspaceModelData.period;
            if (oArtifact.luid === undefined) {
                oArtifact.luid = sap.secmon.ui.browse.utils.generateLuid(oWorkspaceModelData.artifacts);
            }
        });

        var oModel = this.getModel();
        oModel.setData(oWorkspaceModelData);

        this._aaChangedPatterns = {};

        if (sArtifactId) {
            var iSelectedIndex = this._getArtifactIndexById(sArtifactId);
            this._displayArtifact(iSelectedIndex, true);
        } else if (iArtifactIndex > -1) {
            this._displayArtifact(iArtifactIndex);
        } else if (!$.isEmptyObject(oWorkspaceModelData.artifacts)) {
            this._displayArtifact(0);
        } else {
            if (oWorkspaceModelData.hasOwnProperty("browsingView") && oWorkspaceModelData.browsingView === sap.secmon.ui.browse.Constants.C_BROWSING_VIEW.TABLE) {
                var oParams = {
                    context : {
                        getModel : function() {
                            return oModel;
                        },
                        getPath : function() {
                            return "/paths/0/filters/1";
                        } // when called from Sherlog there is always only one filter available
                    }
                };
                sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SHOW_DATA, oParams);
            } else {
                // default representation if no or unknown value is set of browsingView
                this._displayBrowsingChart4LastSubset(!bUpdateCountsAndChart);
            }
        }

        if (bUpdateCountsAndChart) {
            this._updateCountsAndChart();
        }
        this._setWSChanged(false);
        this._setPatternChanged(false);
    },

    _updateCountsAndChart : function() {
        this._updateCurrentlyDisplayedChart();
        this._updateRecordsCount();
    },

    _updateCurrentlyDisplayedChart : function() {
        var oBindingContext, oParams;
        switch (this._sDisplayedArtifactType) {
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART:
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN:
            var oChart = this.getChart();
            if (oChart) {
                oChart.handleFeedsChanged();
            }
            break;
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.BROWSINGCHART:
            var oBrowsingChart = this.getBrowsingChart();
            if (oBrowsingChart) {
                if (oBrowsingChart.showBubblegram() && oBrowsingChart.getBubblegram().refresh) {
                    oBrowsingChart.getBubblegram().refresh();
                } else {
                    oBrowsingChart.handleFeedsChanged();
                }
            }
            break;
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.RAWDATA:
            var oRawData = this.getRawData();
            oBindingContext = {
                sPath : oRawData.getProperty("bindingPath"),
                getPath : function() {
                    return this.sPath;
                },
                getModel : function() {
                    return sap.ui.getCore().getModel("WorkspaceModel");
                }
            };
            // trigger in controller
            oParams = {
                context : oBindingContext
            };
            sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SHOW_DATA, oParams);
            break;
        case sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.ORIGINALDATA:
            var oOriginalData = this.getOriginalData();
            oBindingContext = {
                sPath : oOriginalData.getProperty("bindingPath"),
                getPath : function() {
                    return this.sPath;
                },
                getModel : function() {
                    return sap.ui.getCore().getModel("WorkspaceModel");
                }
            };
            // trigger in controller
            oParams = {
                context : oBindingContext
            };
            sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_SHOW_ORIGINAL_DATA, oParams);
            break;
        }
    },

    _handleWorkspaceCreate : function(oEvent) {
        var that = this;
        this._checkChangedWS(function() {
            that.initialize();
        });
    },

    _handleWorkspaceOpen : function(oEvent) {

        var that = this;

        // if (!this._oOpenWorkspaceDialog) {
        // create a dummy Controller for the action in the Dialog
        var oDummyController = {
            pressedOpenWorkspace : function(oEvent) {
                that._oOpenWorkspaceDialog.close();
                var sModelPath = oEvent.getParameters()[0];
                var sWorkspaceId = oEvent.getParameters()[1];
                that._checkChangedWS(function() {
                    var oWorkspaceListModel = sap.ui.getCore().getModel("WorkspaceListModel");
                    var sSerializedData = oWorkspaceListModel.getProperty(sModelPath + "(X'" + sWorkspaceId + "')/SerializedData");
                    var oWorkspaceDataLoaded = JSON.parse(sSerializedData);
                    for (var i = 0, len = oWorkspaceDataLoaded.paths.length; i < len; i++) {
                        if (oWorkspaceDataLoaded.paths[i].count === -1) {
                            oWorkspaceDataLoaded.paths[i].count = oTextBundle.getText("BrowseCountUnknown");
                            for (var j = 0, lenfilters = oWorkspaceDataLoaded.paths[i].filters.length; j < lenfilters; j++) {
                                if (oWorkspaceDataLoaded.paths[i].filters[j].count === -1) {
                                    oWorkspaceDataLoaded.paths[i].filters[j].count = oTextBundle.getText("BrowseCountUnknown");
                                }
                            }
                        }
                    }

                    that._setWorkspaceData(sWorkspaceId, oWorkspaceDataLoaded);
                });

                // reset workspace
                that.reset();
            },

            workspaceDeleted : function(oEvent) {
                var sWorkspaceId = oEvent.getParameters()[0];
                if (sWorkspaceId === that.getModel().getData().workspaceId) {
                    that.initialize();
                }
            },

            pressedClose : function() {
                that._oOpenWorkspaceDialog.close();
            }
        };

        sap.ui.getCore().getModel("WorkspaceListModel").refresh(true);
        that._oOpenWorkspaceDialog = sap.ui.xmlfragment("sap.secmon.ui.browse.OpenWorkspace", oDummyController);
        that._oOpenWorkspaceDialog.setModel(this.getModel("i18n"), "i18n");
        that._oOpenWorkspaceDialog.open();
    },

    _handleWorkspaceSave : function(oEvent) {

        var that = this;
        var messageText = "";
        var oCurrModelData = this.getModel().getData();

        var iArtifactIndex = -1;
        if (!$.isEmptyObject(oCurrModelData.artifacts) &&
                (this._sDisplayedArtifactType === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART || this._sDisplayedArtifactType === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN)) {
            var iArtifactLuid = this.getChart().getArtifactLuid();
            iArtifactIndex = sap.secmon.ui.browse.utils.getArtifactIdxByLuid(iArtifactLuid, oCurrModelData);
        }

        if (oCurrModelData.workspaceId === undefined || oCurrModelData.workspaceId === "") { // create

            if (!this._oSaveWorkspaceDialog) {
                var oDummyController = {
                    pressedOK : function() {
                        var sNewName = that._oSaveWorkspaceDialog.getModel().getData().name;
                        var sNewNamespace = that._oSaveWorkspaceDialog.getModel().getData().namespace;
                        if (sNewNamespace !== undefined && sNewNamespace !== "" && sNewName !== undefined && sNewName !== "") {
                            if (sNewName.length <= 60) {
                                // that._oSaveWorkspaceDialog.close();

                                var oWorkspaceData = sap.ui.getCore().getModel("WorkspaceModel").getData();
                                oWorkspaceData.name = sNewName;
                                oWorkspaceData.description = sNewName;
                                oWorkspaceData.namespace = sNewNamespace;

                                fnSaveWorkspace(true, oWorkspaceData);
                            } else {
                                sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_WSNameTooLong"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                        .getText("BU_TIT_SaveCurrWSAs"), sap.ui.commons.MessageBox.Action.OK);
                            }
                        } else {
                            sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_WorkspaceNoName"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                    .getText("BU_TIT_SaveCurrWSAs"), sap.ui.commons.MessageBox.Action.OK);
                        }                                
                    },

                    pressedCancel : function() {
                        that._oSaveWorkspaceDialog.close();
                    }
                };

                this._oSaveWorkspaceDialog = sap.ui.xmlfragment("dlWSSave", "sap.secmon.ui.browse.SaveWorkspace", oDummyController);
                this._oSaveWorkspaceDialog.setModel(this.getModel("i18n"), "i18n");
                this._oSaveWorkspaceDialog.setModel(this.getModel("NamespacesModel"), "NamespacesModel");
            }

            var oWorkspaceSaveModel = new sap.ui.model.json.JSONModel();
            oWorkspaceSaveModel.setData({
                name : that.getModel().getProperty("/name"),
                namespace : that.getModel().getProperty("/namespace"),
                workspaceTitle : oTextBundle.getText("BU_TIT_SaveCurrWS"),
                namespaceVisible : true
            });
            this._oSaveWorkspaceDialog.setModel(oWorkspaceSaveModel);
            this._oSaveWorkspaceDialog.open();

        } else {
            sap.secmon.ui.browse.utils.isReadOnly(oCurrModelData.namespace, function(bReadOnly) {

                function fnCallbackOvewriteWSConfirm(bResult) {
                    if (bResult) {
                        fnSaveWorkspace(false, oCurrModelData);
                    }
                }

                function fnCallbackCustomizeWSConfirm(bResult) {
                    if (bResult) {
                        fnSaveCustomizedWorkspace(oCurrModelData);
                    }
                }

                if (bReadOnly) {
                    if (that._getWSChanged()) {
                        sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_WSDoSaveAs", oCurrModelData.name), sap.ui.commons.MessageBox.Icon.INFORMATION, oTextBundle.getText("BU_TIT_SaveWS"),
                                sap.ui.commons.MessageBox.Action.OK);
                    } else if (that._getPatternChanged()) {
                        // TODO: use the exact pattern names in the
                        // message
                        var sAffectedPatternNames = '';
                        for ( var currArtifact in that._aaChangedPatterns) {
                            if (that._aaChangedPatterns.hasOwnProperty(currArtifact)) {
                                sAffectedPatternNames = sAffectedPatternNames + that._aaChangedPatterns[currArtifact].name + ', ';
                            }
                        }
                        // remove the last ', '
                        sAffectedPatternNames = sAffectedPatternNames.substr(0, sAffectedPatternNames.length - 2);
                        sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_WSCustomize", [ sAffectedPatternNames, oCurrModelData.name ]), fnCallbackCustomizeWSConfirm, oTextBundle
                                .getText("BU_TIT_SaveWS"));
                    }
                } else {
                    if (sap.ui.getCore().getModel("WorkspaceListModel").getProperty("/Qube(X'" + oCurrModelData.workspaceId + "')/Published") === '1') {
                        sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_WSOverwrite", oCurrModelData.name), fnCallbackOvewriteWSConfirm, oTextBundle.getText("BU_TIT_SaveWS"));
                    } else {
                        fnSaveWorkspace(false, oCurrModelData);
                    }
                }
            });
        }

        function fnSaveCustomizedWorkspace(oWorkspaceData) {
            var oPayload = {};
            oPayload.workspaceId = oWorkspaceData.workspaceId;
            oPayload.operation = 'setCustomerPatternConfig';
            oPayload.artifacts2Update = [];

            $.each(oWorkspaceData.artifacts, function(idx, oArtifact) {
                if (that._aaChangedPatterns.hasOwnProperty(oArtifact.artifactId)) {
                    oPayload.artifacts2Update.push(oArtifact);
                }
            });

            var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_QUBE_DML_PATH, JSON.stringify(oPayload));

            promise.done(function(response, textStatus, XMLHttpRequest) {
                messageText = oTextBundle.getText("BU_MSG_WSCustomizeOk", oWorkspaceData.name);
                // sap.m.MessageToast.show(messageText);
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, messageText);

                that._aaChangedPatterns = {};
                that._displayArtifact(iArtifactIndex);
            });
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                if (errorThrown !== "abort") {
                    messageText = oTextBundle.getText("BU_MSG_WSCustomizeFailed", oWorkspaceData.name) + ": " + jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                }
            });
        }

        function fnSaveWorkspace(bInsert, oWorkspaceData) {

            if (that._oSaveWorkspaceDialog) {
                that._oSaveWorkspaceDialog.setBusy(true);
            }

            var aaUsedDatasets = {};
            var aSubsets2Visit = [];
            var reSubset = /Path\d+\.Subset\d+/g;

            if (!$.isEmptyObject(oWorkspaceData.artifacts)) {
                $.each(oWorkspaceData.artifacts, function(idx, oArtifact) {
                    if (oArtifact.toBeUpdated) {
                        delete oArtifact.toBeUpdated;
                    }
                    if (oArtifact.now && oArtifact.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN) {
                        delete oArtifact.now;
                    }
                    oArtifact.namespace = oWorkspaceData.namespace;
                    oArtifact.description = oArtifact.description || "";
                    // var oSnapshotData = $.extend(true, {}, oArtifact.chartData);
                    delete oArtifact.chartData;
                    if (oArtifact.shared) {
                        if (that._aaChangedPatterns.hasOwnProperty(oArtifact.artifactId)) {
                            oArtifact.toBeUpdated = true;
                        }
                        aaUsedDatasets = {};
                        aSubsets2Visit = [];
                        $.each(oArtifact.measures, function(index, oMeasure) {
                            if (oMeasure.startDatasets) {
                                reSubset = /Path\d+\.Subset\d+/g;
                                if (reSubset.exec(oMeasure.startDatasets[0].name) !== null) {
                                    oMeasure.dataSets = [];
                                    aaUsedDatasets = {};
                                    aSubsets2Visit = [];
                                    aSubsets2Visit.push(oMeasure.startDatasets[0].name);
                                    sap.secmon.ui.browse.utils.visitSubset(aSubsets2Visit, oWorkspaceData, oMeasure, aaUsedDatasets);
                                }
                            }
                        });
                        oArtifact.serializedData = JSON.stringify(oArtifact);
                    }
                });
            }

            oWorkspaceData.operation = bInsert ? "insert" : "update";
            oWorkspaceData.description = "";
            oWorkspaceData.published = oWorkspaceData.published || '1';

            // TODO for testing category, remove it after the testing
            // oWorkspaceData.category = "TESTING";

            var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_QUBE_DML_PATH, JSON.stringify(oWorkspaceData));

            promise.done(function(response, textStatus, XMLHttpRequest) {
                messageText = oTextBundle.getText("BU_MSG_WSSavedOK", oWorkspaceData.name);
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, messageText);
                that._setWorkspaceData(response.workspaceId, response, false, null, iArtifactIndex);
                if (that._oSaveWorkspaceDialog) {
                    that._oSaveWorkspaceDialog.setBusy(false);
                    that._oSaveWorkspaceDialog.close();
                }
            });
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                if (that._oSaveWorkspaceDialog) {
                    that._oSaveWorkspaceDialog.setBusy(false);
                }
                if (errorThrown !== "abort") {
                    messageText = oTextBundle.getText("BU_MSG_WSSaveFailed", oWorkspaceData.name) + ": " + jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                }
            });
        }
    },

    _handleWorkspaceSaveAs : function(oEvent) {

        var that = this;

        var oCurrModelDataCpy = $.extend(true, {}, that.getModel().getData());

        var iArtifactIndex = -1;
        if (!$.isEmptyObject(oCurrModelDataCpy.artifacts) && this._sDisplayedArtifactType === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART &&
                this._sDisplayedArtifactType === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN) {
            var iArtifactLuid = this.getChart().getArtifactLuid();
            iArtifactIndex = sap.secmon.ui.browse.utils.getArtifactIdxByLuid(iArtifactLuid, oCurrModelDataCpy);
        }

        if (!this._oSaveAsWorkspaceDialog) {
            var oDummyController = {
                pressedOK : function() {
                    // TODO: check name >= 60 chars
                    // save the namespace in the backend
                    var oCurrModelDataCpy = $.extend(true, {}, that.getModel().getData());
                    var sNewName = that._oSaveAsWorkspaceDialog.getModel().getData().name;
                    var messageText;
                    if (sNewName !== undefined && sNewName !== "" && sNewName.length <= 60) {
                        oCurrModelDataCpy.name = sNewName;
                        oCurrModelDataCpy.workspaceId = "";
                        oCurrModelDataCpy.description = oCurrModelDataCpy.name;
                        oCurrModelDataCpy.namespace = that._oSaveAsWorkspaceDialog.getModel().getData().namespace;
                        oCurrModelDataCpy.published = '1';
                        oCurrModelDataCpy.version = 1;

                        // Save:
                        var iCounter = 0;
                        // thru the optimization we have
                        // to reload all the pattern
                        // configs from backend sbefore
                        // they are saved.
                        var updateArtifact = function(oArtifact, namespace) {
                            oArtifact.namespace = namespace;
                            oArtifact.description = oArtifact.description || "";
                            oArtifact.shared = false;
                            delete oArtifact.artifactId;
                            delete oArtifact.parentId;
                            if (oArtifact.toBeUpdated) {
                                delete oArtifact.toBeUpdated;
                            }
                            // remove the chartData node
                            delete oArtifact.chartData;
                            // if (oArtifact.chartData) {
                            // delete oArtifact.chartData.sql;
                            // delete oArtifact.chartData.values;
                            // }
                        };

                        (oCurrModelDataCpy.artifacts || []).forEach(function(oArtifact, idx) {
                            if (oArtifact.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN && oArtifact.artifactId) {
                                that._reloadPatternConfig(oArtifact, false, function() {
                                    delete oArtifact.now;
                                    updateArtifact(oArtifact, oCurrModelDataCpy.newNamespace);
                                    iCounter++;
                                });
                            } else if (oArtifact.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART && oArtifact.shared) {
                                oArtifact.serializedData = JSON.stringify(oArtifact);
                                updateArtifact(oArtifact, oCurrModelDataCpy.newNamespace);
                                iCounter++;
                            } else {
                                iCounter++;
                            }
                            if (oArtifact.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN && oArtifact.now) {
                                delete oArtifact.now;
                            }
                        });

                        var idTimer = setInterval(function() {
                            if (iCounter === oCurrModelDataCpy.artifacts.length) {

                                oCurrModelDataCpy.operation = "insert";
                                var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_QUBE_DML_PATH, JSON.stringify(oCurrModelDataCpy));

                                promise.done(function(response, textStatus, XMLHttpRequest) {
                                    messageText = oTextBundle.getText("BU_MSG_WSSavedOK", oCurrModelDataCpy.name);
                                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, messageText);
                                    that._setWorkspaceData(response.workspaceId, response, false, null, iArtifactIndex);
                                    that._oSaveAsWorkspaceDialog.setBusy(false);
                                    that._oSaveAsWorkspaceDialog.close();
                                });
                                promise.fail(function(jqXHR, textStatus, oError) {
                                    that._oSaveAsWorkspaceDialog.setBusy(false);
                                    messageText = 
                                            oTextBundle.getText("BU_MSG_WSSaveFailed", oCurrModelDataCpy.name) + ": " + jqXHR.responseText + " " + jqXHR.status + " " +
                                                    jqXHR.statusText;
                                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                                });

                                // remove the timer
                                clearInterval(idTimer);
                            }
                        }, 1000); // per second

                    } else {
                        sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_WorkspaceNoName"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                            .getText("BU_TIT_SaveCurrWSAs"), sap.ui.commons.MessageBox.Action.OK);
                    }
                },

                pressedCancel : function() {
                    that._oSaveAsWorkspaceDialog.close();
                }
            };
            this._oSaveAsWorkspaceDialog = sap.ui.xmlfragment("dlWSSaveAs", "sap.secmon.ui.browse.SaveWorkspace", oDummyController);
            this._oSaveAsWorkspaceDialog.setModel(this.getModel("i18n"), "i18n");
            this._oSaveAsWorkspaceDialog.setModel(this.getModel("NamespacesModel"), "NamespacesModel");
        }

        var oWorkspaceSaveModel = new sap.ui.model.json.JSONModel();
        oWorkspaceSaveModel.setData({
            name : that.getModel().getProperty("/name"),
            namespace : that.getModel().getProperty("/namespace"),
            workspaceTitle : oTextBundle.getText("BU_TIT_SaveCurrWSAs"),
            namespaceVisible : true
        });
        this._oSaveAsWorkspaceDialog.setModel(oWorkspaceSaveModel);
        this._oSaveAsWorkspaceDialog.open();
    },

    _handleWorkspaceRename : function(oEvent) {
        var that = this;
        if (!this._oRenameWorkspaceDialog) {
            var oDummyController = {
                pressedOK : function() {
                    var oWorkspaceData = that._oRenameWorkspaceDialog.getModel().getData();
                    that.getModel().setProperty("/name", oWorkspaceData.name);
                    that.getModel().setProperty("/namespace", oWorkspaceData.namespace);
                    that._oRenameWorkspaceDialog.close();
                },
                pressedCancel : function() {
                    that._oRenameWorkspaceDialog.close();
                }
            };
            this._oRenameWorkspaceDialog = sap.ui.xmlfragment("dlWSRename", "sap.secmon.ui.browse.SaveWorkspace", oDummyController);
            this._oRenameWorkspaceDialog.setModel(this.getModel("i18n"), "i18n");
            this._oRenameWorkspaceDialog.setModel(this.getModel("NamespacesModel"), "NamespacesModel");
        }
        var oWorkspaceRenameModel = new sap.ui.model.json.JSONModel();
        oWorkspaceRenameModel.setData({
            name : that.getModel().getProperty("/name"),
            namespace : that.getModel().getProperty("/namespace"),
            workspaceId : that.getModel().getProperty("/workspaceId"),
            workspaceTitle : oTextBundle.getText("BU_TIT_RenameCurrWS"),
            namespaceVisible : false
        });
        this._oRenameWorkspaceDialog.setModel(oWorkspaceRenameModel);
        this._oRenameWorkspaceDialog.open();
    },

    _handleWorkspaceVersion : function(oEvent) {
        var that = this;
        if (!this._oVersionWorkspaceDialog) {
            var oDummyController = {
                pressedClose : function() {
                    that._oVersionWorkspaceDialog.close();
                }
            };
            this._oVersionWorkspaceDialog = sap.ui.xmlfragment("dlWSVersion", "sap.secmon.ui.browse.WorkspaceVersion", oDummyController);
            this._oVersionWorkspaceDialog.setModel(this.getModel("i18n"), "i18n");
            this._oVersionWorkspaceDialog.setModel(this.getModel("applicationContext"), "applicationContext");

        }

        this._oVersionWorkspaceDialog.setModel(new sap.ui.model.json.JSONModel());

        var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_QUBE_DML_PATH, JSON.stringify({
            workspaceId : that.getModel().getProperty("/workspaceId"),
            operation : 'getVersionHistory'
        }));

        promise.done(function(versions, textStatus, XMLHttpRequest) {
            var oWorkspaceVersionModel = that._oVersionWorkspaceDialog.getModel();
            versions[0].Version = versions[0].Version || 1;
            oWorkspaceVersionModel.setProperty("/versions", versions);
            that._oVersionWorkspaceDialog.open();
        });
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            if (errorThrown !== "abort") {
                var messageText = oTextBundle.getText("BU_MSG_VersionFailed", that.getModel().getProperty("/name")) + ": " + jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
            }
        });

    },

    _handleWorkspaceNewAttri : function(oEvent) {
        var that = this;
        if (!this._oWorkspaceNewAttriDialog) {
            var oDummyController = {
                pressedOK : function() {
                    that.getModel().setProperty("/category", that._oWorkspaceNewAttriDialog.getModel().getData().category);
                    that.getModel().setProperty("/useCase", that._oWorkspaceNewAttriDialog.getModel().getData().useCase);
                    that.getModel().setProperty("/comment", that._oWorkspaceNewAttriDialog.getModel().getData().comment);
                    that.getModel().setProperty("/processStatus", that._oWorkspaceNewAttriDialog.getModel().getData().processStatus);
                    that.getModel().setProperty("/riskClassification", that._oWorkspaceNewAttriDialog.getModel().getData().riskClassification);
                    that._oWorkspaceNewAttriDialog.close();
                },
                pressedCancel : function() {
                    that._oWorkspaceNewAttriDialog.close();
                }
            };
            this._oWorkspaceNewAttriDialog = sap.ui.xmlfragment("dlWSNewAttri", "sap.secmon.ui.browse.WorkspaceAttributes", oDummyController);
            this._oWorkspaceNewAttriDialog.setModel(this.getModel("i18n"), "i18n");
            this._oWorkspaceNewAttriDialog.setModel(this.getModel("enums"), "enums");
        }
        var oWorkspaceNewAttriModel = new sap.ui.model.json.JSONModel();
        oWorkspaceNewAttriModel.setData({
            // name : that.getModel().getProperty("/name"),
            // namespace : that.getModel().getProperty("/namespace"),
            category : that.getModel().getProperty("/category"),
            useCase : that.getModel().getProperty("/useCase"),
            comment : that.getModel().getProperty("/comment"),
            processStatus : that.getModel().getProperty("/processStatus"),
            riskClassification : that.getModel().getProperty("/riskClassification"),
            workspaceId : that.getModel().getProperty("/workspaceId"),
        });
        this._oWorkspaceNewAttriDialog.setModel(oWorkspaceNewAttriModel);
        this._oWorkspaceNewAttriDialog.open();
    },

    _updateRecordsCount : function(aaSubsets) {

        var that = this;

        var oWorkspaceModel = this.getModel();
        var oWorkspaceData = oWorkspaceModel.getData();

        var oMultiQuery = {
            operation : sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_MULTI_RECORDS_COUNT,
            requests : []
        };
        oMultiQuery.verbose = sap.secmon.ui.browse.utils.getController().bDebug;
        // load log event from warm storage
        oMultiQuery.forceWarm = sap.secmon.ui.browse.utils.getController()._bForceWarm;

        var startSubset = "";

        for (var i = 0, maxLen = oWorkspaceData.paths !== undefined ? oWorkspaceData.paths.length : 0; i < maxLen; i++) {

            startSubset = "Path" + oWorkspaceData.paths[i].luid;
            if (!aaSubsets || (aaSubsets && aaSubsets.hasOwnProperty(startSubset))) {
                oMultiQuery.requests.push({
                    operation : sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_RECORDS_COUNT,
                    startDatasets : [ {
                        name : startSubset
                    } ],
                    context : oWorkspaceData.paths[i].context !== undefined ? oWorkspaceData.paths[i].context : (oWorkspaceData.context !== undefined ? oWorkspaceData.context : ""),
                    period : oWorkspaceData.period,
                    now : oWorkspaceData.now
                });
                oWorkspaceData.paths[i].count = oTextBundle.getText("BrowseCountLoading");
            }
            for (var j = 0, jmaxLen = oWorkspaceData.paths[i].filters.length; j < jmaxLen; j++) {
                startSubset = "Path" + oWorkspaceData.paths[i].luid + ".Subset" + oWorkspaceData.paths[i].filters[j].luid;
                if (!aaSubsets || (aaSubsets && aaSubsets.hasOwnProperty(startSubset))) {
                    var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(startSubset, oWorkspaceData, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_RECORDS_COUNT, null, null);
                    oMultiQuery.requests.push(oQuery);
                    oWorkspaceData.paths[i].filters[j].count = oTextBundle.getText("BrowseCountLoading");
                }
            }
        }

        if (oMultiQuery.requests.length > 0) {

            this._abortMutliCount();

            oWorkspaceModel.setData(oWorkspaceData);

            var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oMultiQuery));
            this._oMultiCntPromise = promise;

            promise.done(function(response, textStatus, XMLHttpRequest) {

                that._oMultiCntPromise = undefined;

                for (var k = 0, maxLen = response.data.length; k < maxLen; k++) {

                    var sDatasetName = response.data[k].data[0].datasetName, aPath, sPathLuid, idxPath;

                    if (sDatasetName.indexOf(".") > -1) {
                        var aBuf = sDatasetName.split(".");
                        aPath = aBuf[0].split("Path");
                        var aSubset = aBuf[1].split("Subset");

                        sPathLuid = aPath[1];
                        var sSubsetLuid = aSubset[1];

                        idxPath = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceData);
                        var idxSubset = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(sSubsetLuid, idxPath, oWorkspaceData);

                        oWorkspaceData.paths[idxPath].filters[idxSubset].count = response.data[k].data[0].COUNT;
                    } else {
                        aPath = sDatasetName.split("Path");
                        sPathLuid = aPath[1];
                        idxPath = sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceData);
                        oWorkspaceData.paths[idxPath].count = response.data[k].data[0].COUNT;
                    }
                }

                oWorkspaceModel.setData(oWorkspaceData);

                var messageText = oTextBundle.getText("BU_MSG_WSRefreshed", oWorkspaceData.name);
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, messageText);
            });

            promise.fail(function(jqXHR, textStatus, errorThrown) {
                that._oMultiCntPromise = undefined;
                // reset count to Unknown
                for (var i = 0, maxLen = oWorkspaceData.paths !== undefined ? oWorkspaceData.paths.length : 0; i < maxLen; i++) {
                    for (var j = 0, jmaxLen = oWorkspaceData.paths[i].filters.length; j < jmaxLen; j++) {
                        oWorkspaceData.paths[i].filters[j].count = oTextBundle.getText("BrowseCountUnknown");

                    }
                }
                oWorkspaceModel.setData(oWorkspaceData);
                if (errorThrown !== "abort") {
                    var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                }
            });
        }
    },

    _handleChangeTimePeriod : function(oEvent) {
        var oTimeRangeSelector;
        var that = this;
        var oWorkspaceData = this.getModel().getData();

        if (oWorkspaceData.period === undefined) {
            oWorkspaceData.period = {
                operator : "=",
                searchTerms : [ sap.secmon.ui.browse.Constants.C_TIMERANGE.LAST_HOUR ]
            };
        }

        var oWorkspacePeriod = oWorkspaceData.period, sFromTS, sToTS, sRelativeValue;
        var sTRType = sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_RELATIVE;

        if (oWorkspacePeriod.operator === "" || oWorkspacePeriod.operator === "=") {
            sTRType = sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_RELATIVE;
            oWorkspacePeriod.operator = "=";
        } else if (oWorkspacePeriod.operator === "BETWEEN") {
            sTRType = sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_ABSOLUTE;
        }

        if (oWorkspacePeriod.searchTerms.length === 0) {
            sRelativeValue = sap.secmon.ui.browse.Constants.C_TIMERANGE.LAST_HOUR;
            sToTS = new Date();
            sFromTS = new Date(sToTS.getTime() - 3600 * 1000);

            sToTS = sap.secmon.ui.browse.utils.getDateAsYyyymmddUTC(sToTS) + 'T' + sap.secmon.ui.browse.utils.getTimeAsHHMMSSUTC(sToTS) + 'Z';
            sFromTS = sap.secmon.ui.browse.utils.getDateAsYyyymmddUTC(sFromTS) + 'T' + sap.secmon.ui.browse.utils.getTimeAsHHMMSSUTC(sFromTS) + 'Z';

            if (sTRType === sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_RELATIVE) {
                oWorkspacePeriod.searchTerms.push(sRelativeValue);
            } else if (sTRType === sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_ABSOLUTE) {
                oWorkspacePeriod.searchTerms.push(sFromTS);
                oWorkspacePeriod.searchTerms.push(sToTS);
            }
        } else {
            if (sTRType === sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_RELATIVE) {
                sRelativeValue = oWorkspacePeriod.searchTerms[0];
                if (sRelativeValue === sap.secmon.ui.browse.Constants.C_TIMERANGE.LAST_HOUR) {
                    sToTS = new Date();
                    sFromTS = new Date(sToTS.getTime() - 3600 * 1000);

                    sToTS = sap.secmon.ui.browse.utils.getDateAsYyyymmddUTC(sToTS) + 'T' + sap.secmon.ui.browse.utils.getTimeAsHHMMSSUTC(sToTS) + 'Z';
                    sFromTS = sap.secmon.ui.browse.utils.getDateAsYyyymmddUTC(sFromTS) + 'T' + sap.secmon.ui.browse.utils.getTimeAsHHMMSSUTC(sFromTS) + 'Z';
                }
            } else if (sTRType === sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_ABSOLUTE) {
                sFromTS = oWorkspacePeriod.searchTerms[0];
                sToTS = oWorkspacePeriod.searchTerms[1];
            }
        }

        function fnTimeRangeValid() {

            sap.secmon.ui.browse.utils.getController()._oCache.invalidate();
            oWorkspaceData = that.getModel().getData();
            oWorkspaceData.period = oWorkspacePeriod;
            // update the period change in all artifacts
            $.each(oWorkspaceData.artifacts, function(index, oArtifact) {
                oArtifact.period = oWorkspaceData.period;
                if (oArtifact.chartData) {
                    delete oArtifact.chartData;
                }
            });
            that.getModel().setData(oWorkspaceData);

            // update period in browsing chart
            if (that._sDisplayedArtifactType === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.BROWSINGCHART) {
                that.getBrowsingChart().updatePeriod(oWorkspacePeriod);
            }

            // update the counts and currently displayed chart
            that._updateCountsAndChart();

            that._oTimePeriodPopup.close();
        }

        var oView = sap.secmon.ui.browse.utils.getView();

        if (!this._oTimePeriodPopup) {

            oTimeRangeSelector = new sap.secmon.ui.browse.TimeRange({
                type : sTRType,
                value : {
                    showUTC : oView.getModel('applicationContext').getData().UTC,
                    relativeValue : sRelativeValue,
                    absoluteValue : {
                        from : sFromTS,
                        to : sToTS
                    }
                },
                relativeIntervals : {
                    path : "TimeRangeModel>/",
                    template : new sap.ui.base.ManagedObject(),
                    templateShareable : false
                }
            });

            this._oTimePeriodPopup =
                    new sap.m.Dialog({
                        title : "{i18n>BU_TIT_TimePeriod2}",
                        buttons : [
                                new sap.m.Button({
                                    text : "{i18n>BU_BUT_OK}",
                                    enabled : true,
                                    press : function(oEvent) {
                                        // oTimeRangeSelector.fireValidateValues();
                                        var oVal = oTimeRangeSelector.getValue();
                                        var sType = oTimeRangeSelector.getType();
                                        if (sType === sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_RELATIVE) {
                                            if (oVal.relativeValue) {
                                                oWorkspacePeriod = {
                                                    operator : '=',
                                                    searchTerms : [ oVal.relativeValue ]
                                                };
                                                fnTimeRangeValid();
                                            } else {
                                                sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_CrFilterNoRelTS"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                                        .getText("BU_TIT_TimePeriod"), sap.ui.commons.MessageBox.Action.OK);
                                            }
                                        } else if (sType === sap.secmon.ui.browse.Constants.C_TIMERANGE.TYPE_ABSOLUTE) {
                                            if (oVal.absoluteValue.from > oVal.absoluteValue.to) {
                                                sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_CrFilterFromGRTo"), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                                        .getText("BU_TIT_TimePeriod"), sap.ui.commons.MessageBox.Action.OK);
                                            } else {
                                                oWorkspacePeriod = {
                                                    operator : 'BETWEEN',
                                                    searchTerms : [ oVal.absoluteValue.from, oVal.absoluteValue.to ]
                                                };
                                                fnTimeRangeValid();
                                            }
                                        }
                                        var sBrowsingChartSubset = that.getBrowsingChart().getStartSubset();
                                        var sBrowsingChartContext = that.getBrowsingChart().getContext();
                                        sap.secmon.ui.browse.utils.checkWorkspaceTimeRange(oWorkspaceData);
                                        that.getBrowsingChart().displayBrowsingChart(sBrowsingChartSubset, sBrowsingChartContext, true);
                                        that.getBrowsingChart().getAggregation('_layout').getAggregation('top').getContent()[0].getRightItems()[1].setPressed(false);
                                    }
                                }), new sap.m.Button({
                                    text : "{i18n>BU_BUT_Cancel}",
                                    enabled : true,
                                    press : function(oEvent) {
                                        that._oTimePeriodPopup.close();
                                    }
                                }) ],
                        content : [ oTimeRangeSelector ]
                    });
            oView.addDependent(that._oTimePeriodPopup);
        }

        // sync compact style
        // var oView =
        // sap.secmon.ui.browse.utils.getController().getView().addDependent(oTimePeriodPopup);
        $.sap.syncStyleClass("sapUiSizeCompact", oView, this._oTimePeriodPopup);
        // set the value before popup
        oTimeRangeSelector = this._oTimePeriodPopup.getContent()[0];
        var oValue = oTimeRangeSelector.getValue();
        var sType;

        if (oWorkspacePeriod.operator === "=") {
            sType = oTimeRangeSelector.TYPE_RELATIVE;
            oValue.relativeValue = oWorkspacePeriod.searchTerms[0];
        } else {
            sType = oTimeRangeSelector.TYPE_ABSOLUTE;
            oValue.absoluteValue = {
                from : oWorkspacePeriod.searchTerms[0],
                to : oWorkspacePeriod.searchTerms[1]
            };
        }
        oTimeRangeSelector.setType(sType);
        oTimeRangeSelector.setValue(oValue);

        this._oTimePeriodPopup.open();
    },

    _handleChangeFacetName : function(oEvent) {
        alert("_handleChangeFacetName");
    },

    renderer : function(oRm, oControl) {
        oRm.renderControl(oControl._borderlayout);
    },

    onBeforeRendering : function() {

    },

    onAfterRendering : function() {

    },

    // TODO: move to Path.js
    _addPath : function() {

        var oWorkspaceModel = this.getModel();
        var oWorkspaceData = oWorkspaceModel.getData();

        var iLuid = sap.secmon.ui.browse.utils.generateLuid(oWorkspaceData.paths);

        var sLastPathContext = oWorkspaceData.paths[oWorkspaceData.paths.length - 1].context;
        var sLastPathCount = oWorkspaceData.paths[oWorkspaceData.paths.length - 1].count;
        var sLastPathLuid = oWorkspaceData.paths[oWorkspaceData.paths.length - 1].luid;

        // add a new path
        oWorkspaceData.paths.push({
            context : sLastPathContext,
            luid : iLuid,
            name : "Path" + iLuid,
            filters : [],
            count : sLastPathCount
        });
        oWorkspaceData.selectedSubsetId = "Path" + iLuid;
        oWorkspaceModel.setData(oWorkspaceData);

        var promise = sap.secmon.ui.browse.utils.getController()._oCache.getData([ {
            context : sLastPathContext,
            subsetId : "Path" + sLastPathLuid,
        } ], oWorkspaceData);

        sap.secmon.ui.browse.utils.getController()._oCache.setData([ {
            context : sLastPathContext,
            subsetId : "Path" + iLuid,
        } ], promise);

        this._displayBrowsingChart("Path" + iLuid, sLastPathContext, true);
    },

    addSubsetFromChart : function(oNewFilterData) {
        // convert integer data from string to integer
        if (sap.secmon.ui.browse.utils.isTypeNumber(oNewFilterData.dataType)) {
            oNewFilterData.valueRange.searchTerms.forEach(function(sTerm, i) {
                if (isNaN(sTerm)) {
                    throw new Error("dataType is " + oNewFilterData.dataType + " but data is " + sTerm);
                } else {
                    oNewFilterData.valueRange.searchTerms[i] = parseInt(sTerm);
                }
            });
        }

        var aPaths = this._layout.getContent();
        $.each(aPaths, function(index, oPath) {
            if (oPath._toolbar.getItems()[0].getText() === oNewFilterData.workspaceContext.split(".")[0]) {
                oPath._updateSubsetInWorkspace(oNewFilterData);
                return false;
            }
        });

    },
    _createWorkspaceExplorer : function() {

        var that = this;
        var oView = sap.secmon.ui.browse.utils.getView();
        that._oWSExplorerContainer.setModel(oView.getModel("i18n"), "i18n");
        that._oWSExplorerContainer.setModel(oView.getModel("applicationContext"), "applicationContext");

        // Read workspace list
        var oWorkspaceListModel = sap.ui.getCore().getModel("WorkspaceListModel");
        oWorkspaceListModel.read("/Qube?$filter=Type eq 'Workspace'", {
            success : function(oData, oResponse) {
                if (oData.results) {
                    that._updateModels4WSExplorer(oData.results);
                    that._oWSExplorer = new sap.secmon.ui.browse.WorkspaceExplorer({
                        openWorkspace : function(oEvent) {
                            that._oWSExplorerContainer.close();
                            var sWorkspaceId = oEvent.getParameter("workspaceId");
                            var sSerializedData = oEvent.getParameter("serializedData");
                            that._checkChangedWS(function() {
                                var oWorkspaceDataLoaded = JSON.parse(sSerializedData);
                                for (var i = 0, len = oWorkspaceDataLoaded.paths.length; i < len; i++) {
                                    if (oWorkspaceDataLoaded.paths[i].count === -1) {
                                        oWorkspaceDataLoaded.paths[i].count = oTextBundle.getText("BrowseCountUnknown");
                                        for (var j = 0, lenfilters = oWorkspaceDataLoaded.paths[i].filters.length; j < lenfilters; j++) {
                                            if (oWorkspaceDataLoaded.paths[i].filters[j].count === -1) {
                                                oWorkspaceDataLoaded.paths[i].filters[j].count = oTextBundle.getText("BrowseCountUnknown");
                                            }
                                        }
                                    }
                                }

                                var sNow = sap.secmon.ui.browse.utils.formatDateTime(new Date());
                                oWorkspaceDataLoaded.now = sNow;
                                
                                sap.secmon.ui.browse.utils.checkTimeRangesConsistency(oWorkspaceDataLoaded);
                                // After openning a workspace always show BrowsingCharts even though
                                // it is saved as BubbleChart.
                                // Reason: Currently we have performace issue with BubbleChart
                                oWorkspaceDataLoaded.browsingView = sap.secmon.ui.browse.Constants.C_BROWSING_VIEW.BROWSING_CHART;
                                that._setWorkspaceData(sWorkspaceId, oWorkspaceDataLoaded, true);
                            });

                            // reset workspace
                            that.reset();
                        },
                        update : function(oEvent) {
                            that._retrieveModels4WSExplorer();
                        },
                        workspaceDeleted : function(oEvent) {
                            var sWorkspaceId = oEvent.getParameters()[0];
                            if (sWorkspaceId === that.getModel().getData().workspaceId) {
                                that.initialize();
                            }
                        }
                    });
                    that._oWSExplorerContainer.addContent(that._oWSExplorer);
                    that._oWSExplorerContainer.setBusy(false);
                }

            },
            error : function(oError) {
                that._oWSExplorerContainer.setBusy(false);
                var messageText = oError.message;
                sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
            }
        });
    },
    /**
     * update models for workspace explorer
     * 
     * @memberOf sap.secmon.ui.browse.Workspace
     */
    _retrieveModels4WSExplorer : function(result) {
        var that = this;
        var oWorkspaceListModel = sap.ui.getCore().getModel("WorkspaceListModel");
        that._oWSExplorerContainer.setBusy(true);
        if (!result) {
            oWorkspaceListModel.read("/Qube?$filter=Type eq 'Workspace'", {
                success : function(oData, oResponse) {
                    if (oData.results) {
                        that._updateModels4WSExplorer(oData.results);
                        that._oWSExplorer.rebuild();
                        that._oWSExplorerContainer.setBusy(false);
                    }
                },
                error : function(oError) {
                    that._oWSExplorerContainer.setBusy(false);
                    var messageText = oError.message;
                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                }
            });
        }
    },

    /**
     * update models for workspace explorer
     * 
     * @memberOf sap.secmon.ui.browse.Workspace
     */
    _updateModels4WSExplorer : function(result) {

        var sUserName = this.getModel("applicationContext").getProperty("/userName");

        // sort result by name alphabetically
        result.sort(function(a, b) {
            var nameA = a.Name.toUpperCase();
            var nameB = b.Name.toUpperCase();
            return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
        });
        var aDataPrivate = [], aDataAll = [], oDataPrivate = {}, oDataAll = {}, oSerializedData = {}, sCharts, sPatterns;
        $.each(result, function(index, oResult) {
            oSerializedData = JSON.parse(oResult.SerializedData);
            sCharts = "";
            sPatterns = "";
            if (!$.isEmptyObject(oSerializedData.artifacts)) {
                $.each(oSerializedData.artifacts, function(index, oArtifact) {
                    if (oArtifact.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN) {
                        if (sPatterns === "") {
                            sPatterns = oArtifact.name;
                        } else {
                            sPatterns = sPatterns + ", " + oArtifact.name;
                        }

                    } else if (oArtifact.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.CHART) {
                        if (sCharts === "") {
                            sCharts = oArtifact.name;
                        } else {
                            sCharts = sCharts + ", " + oArtifact.name;
                        }
                    }
                });
            }

            if (oResult.UserId === sUserName) {
                oDataPrivate = oResult;
                oDataPrivate.Search = oResult.Name + oResult.Namespace + oResult.UserId + oResult.ChangedByUserId + sPatterns + sCharts + oResult.Comment + oResult.Category + oResult.UseCase;
                oDataPrivate.Charts = sCharts;
                oDataPrivate.Patterns = sPatterns;
                aDataPrivate.push(oDataPrivate);
            }

            oDataAll = oResult;
            oDataAll.Search = oResult.Name + oResult.Namespace + oResult.UserId + oResult.ChangedByUserId + sPatterns + sCharts + oResult.Comment + oResult.Category + oResult.UseCase;
            oDataAll.Charts = sCharts;
            oDataAll.Patterns = sPatterns;
            aDataAll.push(oDataAll);

        });
        // Model for All workspaces
        sap.ui.getCore().getModel("WorkspaceListJSONModel").setData(aDataAll);

        // Model for private workspaces
        sap.ui.getCore().getModel("WSListPrivate").setData(aDataPrivate);
    },

    buildWorkspaceModel : function(aData, sFrom, sTo) {
        var oWorkSpaceData = {};
        var oPath = {};
        var aAttrConstants = Object.values(sap.secmon.ui.browse.Constants.C_TIMESTAMP_ATTRIBUTES);

        if (sFrom && sTo) {
            oWorkSpaceData.period = {
                "operator" : "BETWEEN",
                "searchTerms" : [ sFrom, sTo ]
            };
        }
        var aPath = aData.map(function(oItem, i) {
            oPath = {
                idEvent : aData[i].eventId,
                context : "Log",
                count : "",
                luid : i + 1,
                name : "Path" + (i + 1),
                filters : []
            };

            var aFilters = oItem.correlatedAttributes.map(function(oAttr, j) {
                var oFilter = jQuery.extend(true, {}, this.getModel("attrModel").getProperty("/" + oAttr.techId));
                oFilter.workspaceContext = oPath.name + ".Subset" + (j + 1);
                oFilter.context = "Log";
                oFilter.count = "";
                oFilter.isEnumeration = false;
                oFilter.isFieldRef = 0;
                oFilter.eventKey = oAttr.idConnectedEvent;
                oFilter.luid = j + 1;
                oFilter.valueRange = {
                    operator : "=",
                    searchTermRefKeys : [],
                    searchTerms : [ oAttr.value ]
                };
                oFilter.key = oAttr.techId;
                if (aAttrConstants.indexOf(oAttr.techId) > -1) {
                    oFilter.valueRange.operator = "BETWEEN";
                    var from = new Date(oAttr.value);
                    var to = new Date(oAttr.value);
                    // add 999 millisecond to last value in between period,
                    // because values like ...00:00:00.123Z not included in range [ ...00:00:00.000Z ; ...00:00:00.000Z ]
                    to.setMilliseconds(999);
                    oFilter.valueRange.searchTerms = [ from.toISOString(), to.toISOString() ];
                }

                return oFilter;
            }.bind(this));

            oPath.filters = aFilters;

            return oPath;
        }.bind(this));

        this.displayFilters(aPath, aData);
        oWorkSpaceData.paths = aPath;

        return oWorkSpaceData;
    },

    getLastSubset : function(aPath) {
        var oLastPath = aPath[aPath.length - 1];
        var oLastSubset = oLastPath.filters[oLastPath.filters.length - 1];
        return oLastSubset.workspaceContext;
    },

    getDimensions : function(aPath) {
        var oLastPath = aPath[aPath.length - 1];
        return oLastPath.filters.map(function(oFilter) {
            return {
                context : oFilter.context,
                dataType : oFilter.dataType,
                filterOperators : oFilter.filterOperators,
                key : oFilter.key,
                name : oFilter.displayName
            };
        });
    },

    findPath : function(aPaths, idEvent) {
        return aPaths.find(function(oPath) {
            return oPath.idEvent === idEvent;
        });
    },

    displayFilters : function(aPaths, aData) {
        var that = this;
        var aDataReversed = aData.reverse();

        return aDataReversed.forEach(function(oItem) {
            oItem.correlatedAttributes.forEach(function(oAttr) {

                var oConnectedPath = that.findPath(aPaths, oAttr.idConnectedEvent);
                var oCurrentPath = that.findPath(aPaths, oItem.eventId);

                var aConnectedFilters = oConnectedPath.filters;
                var aCurrentFilters = oCurrentPath.filters;
                var oCurrentFilter = aCurrentFilters.find(function(oFilter) {
                    return oFilter.key === oAttr.techId;
                });

                var oConnectedFilter = aConnectedFilters.find(function(oFilter) {
                    return oFilter.valueRange.searchTerms[0] === oCurrentFilter.valueRange.searchTerms[0];
                });

                if (oConnectedFilter) {
                    oCurrentFilter.isFieldRef = 1;
                    oCurrentFilter.valueRange.operator = "=";
                    oCurrentFilter.valueRange.searchTermRefKeys = [ oConnectedFilter.key ];
                    oCurrentFilter.valueRange.searchTerms = [ oConnectedFilter.workspaceContext + "." + oConnectedFilter.displayName ];
                }
            });
        });
    },
});