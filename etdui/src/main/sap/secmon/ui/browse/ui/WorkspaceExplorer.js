/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.WorkspaceExplorer");

$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.DataExplorer");
$.sap.require("sap.m.MessageBox");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.secmon.ui.browse.Constants");

/**
 * Custom control to provide a List of Workspaces. A selected Workspace can be opened, shared or removed. A Workspace can be either private or public.
 * 
 * @memberOf sap.secmon.ui.browse.WorkspaceExplorer
 * @see: Workspace.js
 */
sap.ui.core.Control.extend("sap.secmon.ui.browse.WorkspaceExplorer", {

    metadata : {
        properties : {
            title : {
                type : "string"
            },
            width : {
                type : "sap.ui.core.CSSSize",
                group : "Dimension",
                defaultValue : "100%"
            },
            height : {
                type : "sap.ui.core.CSSSize",
                group : "Dimension",
                defaultValue : "100%"
            }
        },

        aggregations : {
            _layout : {
                type : "sap.ui.commons.layout.MatrixLayout",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            update : {
                modelPath : "string",
                workspaceId : "string"
            },
            openWorkspace : {
                workspaceId : "string",
                serializedData : "string"
            },
            workspaceDeleted : {
                workspaceId : "string"
            },
        }
    },

    C_PRIVATE : 'PRIVATE',
    C_SHARED : 'SHARED',
    C_ALL : 'ALL',

    /**
     * @memberOf sap.secmon.ui.browse.WorkspaceExplorer
     */
    init : function() {
        var that = this;

        // Selected workspaces (can be more than one)
        var oWorkspacesSelected = new sap.ui.model.json.JSONModel();
        oWorkspacesSelected.setData([]);
        this.setModel(oWorkspacesSelected);
        sap.ui.getCore().setModel(oWorkspacesSelected, "WorkspacesSelected");

        var oUISettings = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oUISettings, "UISettings");

        oUISettings.setData({
            view : that.C_ALL,
            shareEnabled : false,
            downloadEnabled : false,
            openEnabled : false,
            deleteEnabled : false
        });

        this._layout = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            height : "100%",
            layoutFixed : true,
            widths : [ "50%", "50%" ],
            columns : 2
        });
        // ToolBar
        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "40px",
        }).addCell(new sap.ui.commons.layout.MatrixLayoutCell({
            hAlign : sap.ui.commons.layout.HAlign.Begin,
            colSpan : 2,
            content : [ that._createToolbar() ]
        }).addStyleClass("sapEtdFeatureCell")));

        // no workspaces available
        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "15px",
        }).addCell(new sap.ui.commons.layout.MatrixLayoutCell({
            hAlign : sap.ui.commons.layout.HAlign.Center,
            colSpan : 2,
            content : [ new sap.ui.commons.TextView("WSEmpty", {
                text : "{i18n>BU_FL_NoWSAvail}"
            }).addStyleClass("sapEtdFeatureTitle") ]
        })));

        // DataSet
        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "100%",
        }).addCell(new sap.ui.commons.layout.MatrixLayoutCell({
            hAlign : sap.ui.commons.layout.HAlign.Begin,
            vAlign : sap.ui.commons.layout.VAlign.Top,
            colSpan : 2,
            content : [ that._createDataSet() ]
        }).addStyleClass("sapEtdFeatureCell")));

        // For spacing purpose
        // this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
        // height : "5px",
        // }).addCell(new sap.ui.commons.layout.MatrixLayoutCell({
        // hAlign : sap.ui.commons.layout.HAlign.Begin,
        // content : [ new sap.ui.commons.Label({
        // text : ""
        // }) ]
        // })));

        // Links
        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "20px",
        }).addCell(new sap.ui.commons.layout.MatrixLayoutCell({
            hAlign : sap.ui.commons.layout.HAlign.Center,
            colSpan : 2,
            content : [ that._createLinks() ]
        }).addStyleClass("sapEtdFeatureCell")));

        this.setAggregation("_layout", this._layout);
    },

    /**
     * create toolbar for workspace explorer
     * 
     * @memberOf sap.secmon.ui.browse.WorkspaceExplorer
     */
    _createToolbar : function() {
        var that = this;
        var oToolbar = new sap.ui.commons.layout.MatrixLayout("toolbar4WSExplorer");
        var oHLayout = new sap.ui.commons.layout.HorizontalLayout();

        // All workspaces
        oHLayout.addContent(new sap.ui.commons.Button({
            text : "{i18n>BU_FL_BUT_All}",
            icon : sap.ui.core.IconPool.getIconURI("list"),
            tooltip : "{i18n>BU_FL_BUT_AllFWS}",
            lite : true,
            style : sap.ui.commons.ButtonStyle.Emph,
            press : function(oEvent) {
                oEvent.getSource().setStyle(sap.ui.commons.ButtonStyle.Emph);
                this.getParent().getContent()[1].setStyle(sap.ui.commons.ButtonStyle.Default);
                var oUISettings = sap.ui.getCore().getModel("UISettings");
                var oUISettingsData = oUISettings.getData();
                oUISettingsData.view = that.C_ALL;
                oUISettings.setData(oUISettingsData);
                that.rebuild();
            }
        }));

        // My workspaces
        oHLayout.addContent(new sap.ui.commons.Button({
            text : "{i18n>BU_FL_BUT_My}",
            icon : sap.ui.core.IconPool.getIconURI("private"),
            tooltip : "{i18n>BU_LBL_MyWSs}",
            lite : true,
            press : function(oEvent) {
                oEvent.getSource().setStyle(sap.ui.commons.ButtonStyle.Emph);
                this.getParent().getContent()[0].setStyle(sap.ui.commons.ButtonStyle.Default);
                this.getParent().getContent()[1].setStyle(sap.ui.commons.ButtonStyle.Default);
                var oUISettings = sap.ui.getCore().getModel("UISettings");
                var oUISettingsData = oUISettings.getData();
                oUISettingsData.view = that.C_PRIVATE;
                oUISettings.setData(oUISettingsData);
                that.rebuild();
            }
        }));


        oToolbar.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            vAlign : sap.ui.commons.layout.VAlign.Bottom,
            hAlign : sap.ui.commons.layout.HAlign.Begin,
            content : [ new sap.ui.commons.Label({
                text : {
                    path : "BU_FL_LBL_Search",
                    model : "i18n",
                    formatter : function(sSearch) {
                        return sSearch + ' :';
                    }
                },
                width : "70px"
            }), new sap.ui.commons.SearchField({
                enableListSuggest : false,
                enableFilterMode : true,
                width : "200px",
                search : [ function(oEvent) {
                    this.searchTerm = oEvent.getParameter("query");
                    this.oDataSet.fireSearch({
                        query : this.searchTerm
                    });
                }, this ]
            }) ]
        }), new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 2,
            vAlign : sap.ui.commons.layout.VAlign.Bottom,
            hAlign : sap.ui.commons.layout.HAlign.End,
            content : [ oHLayout ]
        }));

        return oToolbar;
    },
    /**
     * create content and layout for available workspaces
     * 
     * @memberOf sap.secmon.ui.browse.WorkspaceExplorer
     */
    _createDataSet : function() {

        // this._oWorkspaceExplorer height = 80%
        // subtract contained rows to get left height for dataset
        var height = ($(document).height() * 0.8 - 150) + "px";

        var oScrollContainer = new sap.m.ScrollContainer({
            horizontal : false,
            vertical : true,
            height : height
        });
        // DataSet Private as default
        this.oDataSet = new sap.ui.ux3.DataSet("dataSetWSExplorer", {
            showToolbar : false,
            showSearchField : true,
            multiSelect : true,
            items : {
                path : "/",
                template : new sap.ui.ux3.DataSetItem()
            },
            views : [ new sap.ui.ux3.DataSetSimpleView({
                // name : "{i18n>BU_LBL_MyWSs}",
                // icon : "sap-icon://private",
                // iconHovered : "sap-icon://private",
                // iconSelected : "sap-icon://private",
                floating : false,
                responsive : false,
                itemMinWidth : 0,
                template : this._createTemplate()
            }) ],
            search : [ function(oEvent) {
                var sQuery = oEvent.getParameter("query");
                var oBinding = this.oDataSet.getBinding("items");
                oBinding.filter(!sQuery ? [] : [ new sap.ui.model.Filter("Search", sap.ui.model.FilterOperator.Contains, sQuery) ]);
                this.oDataSet.setLeadSelection(-1);
            }, this ],
            selectionChanged : function search(oEvent) {

                var oUISettings = sap.ui.getCore().getModel("UISettings");
                var oUISettingsData = oUISettings.getData();
                var oWorkspaceData = {};
                var aIndices = oEvent.getSource().getSelectedIndices();

                // read original namespaces
                var aOriginalNamespaces = sap.ui.getCore().getModel("OriginalNamespacesJSONModel").getData();

                var oWorkspacesModel = sap.ui.getCore().getModel("WorkspacesSelected");
                // clear selected workspaces
                oWorkspacesModel.setData([]);

                if (!aIndices || aIndices.length === 0 || aIndices[0] < 0) { // no selction
                    oUISettingsData.shareEnabled = false;
                    oUISettingsData.downloadEnabled = false;
                    oUISettingsData.deleteEnabled = false;
                    oUISettingsData.openEnabled = false;
                    oUISettings.setData(oUISettingsData);
                    oWorkspacesModel.setData([]);
                    return;
                } else if (aIndices.length > 1) { // multiple selection
                    // Delete flag
                    oUISettingsData.deleteEnabled = true;
                    aIndices.some(function(idx) {
                        var selectedObject = oEvent.getSource().getItems()[idx].getBindingContext().getObject();
                        // read original namespaces
                        var bDeletable = false;
                        aOriginalNamespaces.some(function(oOriginalNamespace) {
                            if (oOriginalNamespace.NameSpace === selectedObject.Namespace) {
                                bDeletable = true;
                                return true;
                            }
                        });
                        if (!bDeletable) {
                            oUISettingsData.deleteEnabled = false;
                            return true;
                        }
                    });

                    // always shared
                    oUISettingsData.shareEnabled = true;

                    oUISettingsData.openEnabled = false;
                    oUISettingsData.downloadEnabled = true;
                    oUISettings.setData(oUISettingsData);
                } else { // single selection
                    var shareEnabled = true;
                    var selectedObject = oEvent.getSource().getItems()[aIndices[0]].getBindingContext().getObject();

                    oUISettingsData.deleteEnabled = true;
                    var bDeletable = false;
                    aOriginalNamespaces.some(function(oOriginalNamespace) {
                        if (oOriginalNamespace.NameSpace === selectedObject.Namespace) {
                            bDeletable = true;
                            return true;
                        }
                    });
                    if (!bDeletable) {
                        oUISettingsData.deleteEnabled = false;
                    }

                    oUISettingsData.shareEnabled = shareEnabled;
                    oUISettingsData.downloadEnabled = true;
                    oUISettingsData.openEnabled = true;
                    oUISettings.setData(oUISettingsData);
                }

                aIndices.forEach(function(idx) {

                    var selectedObject = oEvent.getSource().getItems()[idx].getBindingContext().getObject();
                    oWorkspaceData = JSON.parse(JSON.stringify(selectedObject));
                    delete oWorkspaceData.__metadata;

                    var aWorkspaces = oWorkspacesModel.getData();
                    aWorkspaces.push(JSON.parse(JSON.stringify(oWorkspaceData))); // make a copy
                    oWorkspacesModel.setData(aWorkspaces);
                });
            }
        });
        this.oDataSet.setModel(sap.ui.getCore().getModel("WorkspaceListJSONModel"));
        if (this.oDataSet.getModel().getData() && this.oDataSet.getModel().getData().length > 0) {
            sap.ui.getCore().byId("WSEmpty").setVisible(false);
        } else {
            sap.ui.getCore().byId("WSEmpty").setVisible(true);
        }

        oScrollContainer.addContent(this.oDataSet);
        oScrollContainer.addStyleClass("sapEtdBorderTopLine");

        return oScrollContainer;
    },

    /**
     * creates content and layout for available workspaces as templates
     * 
     * @memberOf sap.secmon.ui.browse.WorkspaceExplorer
     */
    _createTemplate : function() {
        return new sap.secmon.ui.browse.DataExplorer({
            formTitel : new sap.ui.layout.HorizontalLayout({
                content : [ new sap.ui.commons.Link({
                    text : {
                        parts : [ {
                            path : "Namespace"
                        }, {
                            path : "Name"
                        } ],
                        formatter : function(sNamespace, sName) {
                            var sText = sNamespace + ": " + sName + "\n";
                            return sText;
                        }
                    },
                    press : [ function(oEvent) {
                        var selectedObject = oEvent.getSource().getBindingContext().getObject();
                        var oWorkspaceModel = sap.ui.getCore().getModel("WorkspacesSelected");
                        var oWorkspaceData = JSON.parse(JSON.stringify(selectedObject));
                        delete oWorkspaceData.__metadata;
                        oWorkspaceModel.setData([ oWorkspaceData ]);
                        // open workspace
                        this._handleWorkspaceOpen(oEvent);
                    }, this ]
                }), new sap.m.Text({
                    text : {
                        path : "Version",
                        formatter : function(iText) {
                            return "(" + "v" + "." + (iText || 1) + ")";
                        }
                    }
                }) ]

            }),
            
            formInfo : new sap.ui.layout.form.Form({
                width : "100%",
                layout : new sap.ui.layout.form.GridLayout(),
                formContainers : [ new sap.ui.layout.form.FormContainer({
                    formElements : [ new sap.ui.layout.form.FormElement({
                        label : new sap.ui.commons.Label({
                            text : "{i18n>BU_LBL_WSCreatedBy}",
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "5"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextField({
                            value : "{UserId}",
                            editable : false
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        label : new sap.ui.commons.Label({
                            text : "{i18n>BU_LBL_WSCreatedAt}",
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "5"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextField({
                            value : {
                                path : "CreationTimestamp",
                                formatter : function(value) {
                                    if (value) {
                                        return sap.secmon.ui.commons.Formatter.dateFormatterEx(this.getModel('applicationContext').getData().UTC, value);
                                    } else {
                                        return "";
                                    }
                                }.bind(this)
                            },
                            editable : false
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        label : new sap.ui.commons.Label({
                            text : "{i18n>BU_LBL_WSChangedBy}",
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "5"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextField({
                            value : "{ChangedByUserId}",
                            editable : false
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        label : new sap.ui.commons.Label({
                            text : "{i18n>BU_LBL_WSChangedAt}",
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "5"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextField({
                            value : {
                                path : "ChangeTimestamp",
                                formatter : function(value) {
                                    if (value) {
                                        return sap.secmon.ui.commons.Formatter.dateFormatterEx(this.getModel('applicationContext').getData().UTC, value);
                                    } else {
                                        return "";
                                    }
                                }.bind(this)
                            },
                            editable : false
                        }) ]
                    }) ]
                }) ]
            }),
            formDetail : new sap.ui.layout.form.Form({
                width : "100%",
                layout : new sap.ui.layout.form.GridLayout(),
                formContainers : [ new sap.ui.layout.form.FormContainer({
                    formElements : [ new sap.ui.layout.form.FormElement({
                        label : new sap.ui.commons.Label({
                            text : "{i18n>BU_LBL_Charts}",
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "2",
                                vCells : 2
                            })
                        }),
                        fields : [ new sap.ui.commons.TextArea({
                            value : {
                                path : "Charts",
                                formatter : function(value) {
                                    if (value !== "") {
                                        return value;
                                    } else {
                                        return "n/a";
                                    }
                                }
                            },
                            editable : false,
                            wrapping : sap.ui.core.Wrapping.Hard,
                            width : "100%",
                            height : "44px"
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        label : new sap.ui.commons.Label({
                            text : "{i18n>BU_LBL_Patterns}",
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "2"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextArea({
                            value : {
                                path : "Patterns",
                                formatter : function(value) {
                                    if (value !== "") {
                                        return value;
                                    } else {
                                        return "n/a";
                                    }
                                }
                            },
                            editable : false,
                            wrapping : sap.ui.core.Wrapping.Hard,
                            width : "100%",
                            height : "44px"
                        }) ]
                    }) ]
                }) ]
            }),
            formAttri : new sap.ui.layout.form.Form({
                width : "100%",
                layout : new sap.ui.layout.form.GridLayout(),
                formContainers : [ new sap.ui.layout.form.FormContainer({
                    formElements : [ new sap.ui.layout.form.FormElement({
                        label : new sap.ui.commons.Label({
                            text : "{i18n>BU_WSL_Comment}",
                            layoutData : new sap.ui.layout.form.GridElementData({
                            // hCells : "4",
                            // vCells : "2"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextArea({
                            value : {
                                path : "Comment",
                                formatter : function(value) {
                                    if (value !== "") {
                                        return value;
                                    } else {
                                        return "n/a";
                                    }
                                }
                            },
                            editable : false,
                            wrapping : sap.ui.core.Wrapping.Hard,
                            width : "100%",
                            height : "33px"
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        label : new sap.ui.commons.Label({
                            text : "{i18n>BU_WSL_UseCase}",
                            layoutData : new sap.ui.layout.form.GridElementData({
                            // hCells : "4"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextArea({
                            value : {
                                path : "UseCase",
                                formatter : function(value) {
                                    if (value !== "") {
                                        return value;
                                    } else {
                                        return "n/a";
                                    }
                                }
                            },
                            editable : false,
                            wrapping : sap.ui.core.Wrapping.Hard,
                            width : "100%",
                            height : "33px"
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        label : new sap.ui.commons.Label({
                            text : "{i18n>BU_WSL_Category}",
                            layoutData : new sap.ui.layout.form.GridElementData({
                            // hCells : "4"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextField({
                            value : {
                                path : "Category",
                                formatter : function(value) {
                                    if (value !== "") {
                                        return value;
                                    } else {
                                        return "n/a";
                                    }
                                }
                            },
                            editable : false,
                            width : "100%",
                        }) ]
                    }) ]
                }) ]
            })
        });
    },
    /**
     * create links to action
     * 
     * @memberOf sap.secmon.ui.browse.WorkspaceExplorer
     */
    _createLinks : function() {

        var oHLayout = new sap.ui.commons.layout.HorizontalLayout();

        // for spacing purpose
        oHLayout.addContent(new sap.ui.commons.Label({
            width : "10px"
        }));

        oHLayout.addContent(new sap.ui.commons.Link({
            text : "{i18n>BU_BUT_WSDownload}",
            tooltip : "{i18n>BU_TOL_WSDownload}",
            visible : "{applicationContext>/userPrivileges/contentDownload}",
            enabled : "{UISettings>/downloadEnabled}",
            press : [ function(oEvent) {
                this._handleWorkspaceDownload(oEvent);
            }, this ]

        }));

        // for spacing purpose
        oHLayout.addContent(new sap.ui.commons.Label({
            width : "10px"
        }));

        oHLayout.addContent(new sap.ui.commons.Link({
            text : "{i18n>BU_BUT_WSExpt}",
            tooltip : "{i18n>BU_TOL_WSExpt}",
            visible : "{applicationContext>/userPrivileges/contentRepExport}",
            enabled : "{UISettings>/downloadEnabled}",
            press : [ function(oEvent) {
                this._handleWorkspaceExport(oEvent);
            }, this ]

        }));
        // for spacing purpose
        oHLayout.addContent(new sap.ui.commons.Label({
            width : "10px"
        }));
        oHLayout.addContent(new sap.ui.commons.Link({
            text : "{i18n>BU_BUT_WSDelete}",
            tooltip : "{i18n>BU_TOL_WSDelete}",
            visible : "{applicationContext>/userPrivileges/workspaceWrite}",
            enabled : "{UISettings>/deleteEnabled}",
            press : [ function(oEvent) {
                this._handleWorkspaceRemove(oEvent);
            }, this ]

        }));

        // for spacing purpose
        oHLayout.addContent(new sap.ui.commons.Label({
            width : "10px"
        }));
        oHLayout.addContent(new sap.ui.commons.Link({
            text : "{i18n>BU_BUT_Open}",
            tooltip : "{i18n>BU_TOL_OpenWS}",
            visible : "{applicationContext>/userPrivileges/workspaceRead}",
            enabled : "{UISettings>/openEnabled}",
            press : [ function(oEvent) {
                this._handleWorkspaceOpen(oEvent);
            }, this ]

        }));
        return oHLayout;
    },

    /**
     * handler for workspace delete
     * 
     * @memberOf sap.secmon.ui.browse.WorkspaceExplorer
     */
    _handleWorkspaceRemove : function(oEvent) {

        var that = this;

        var aWorkspacesSelected = sap.ui.getCore().getModel("WorkspacesSelected").getData();
        sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_WSDelete"), fnCallbackDelWSConfirm, oTextBundle.getText("BU_TIT_WSDelete"));
        function fnCallbackDelWSConfirm(bResult) {
            if (bResult) {
                aWorkspacesSelected.forEach(function(oWorkspaceSelectedData) {

                    var oCurrModelData = {};

                    oCurrModelData.workspaceId = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oWorkspaceSelectedData.Id);
                    oCurrModelData.name = oWorkspaceSelectedData.Name;
                    oCurrModelData.namespace = oWorkspaceSelectedData.Namespace;

                    // check if any pattern in this workspace is used as trigger
                    var oSerializedData = JSON.parse(oWorkspaceSelectedData.SerializedData);

                    // all patterns trigger-based
                    var sAffectedPatternNames = '';
                    oSerializedData.artifacts.forEach(function(oArtifact, iIindex) {
                        if (oArtifact.artifactId && oArtifact.type === sap.secmon.ui.browse.Constants.C_ARTIFACT_TYPE.PATTERN) {
                            var aPatternsByTrigger = sap.secmon.ui.browse.utils.getPatternsByTrigger(oArtifact.artifactId);
                            if (aPatternsByTrigger.constructor === Array) {
                                aPatternsByTrigger.forEach(function(oPattern, iIndex) {
                                    if (oPattern.PatternName) {
                                        sAffectedPatternNames =
                                                sAffectedPatternNames +
                                                        oTextBundle.getText("BU_MSG_PatternList1", [ oPattern.PatternName, oPattern.WorkspaceName + ' ' + oPattern.WorkspaceNamespace ]) + ', ';
                                    } else {
                                        sAffectedPatternNames = sAffectedPatternNames + oTextBundle.getText("BU_MSG_PatternList2", oPattern.WorkspaceName + ' ' + oPattern.WorkspaceNamespace) + ', ';
                                    }
                                });
                                // remove the last ', '
                                sAffectedPatternNames = sAffectedPatternNames.substr(0, sAffectedPatternNames.length - 2);
                            }
                        }
                    });

                    if (sAffectedPatternNames) {
                        sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_WSDelTrigger", [ oCurrModelData.name, sAffectedPatternNames ]), function(bRefConfirmed) {
                            if (bRefConfirmed) {
                                fnDeleteWorkspace(oCurrModelData);
                            }
                        }, oTextBundle.getText("BU_TIT_WSDelete"));
                    } else {
                        fnDeleteWorkspace(oCurrModelData);
                    }

                    function fnDeleteWorkspace(oModelData) {

                        oModelData.operation = "delete";
                        var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_QUBE_DML_PATH, JSON.stringify(oModelData));
                        var messageText = '';

                        promise.done(function(response, textStatus, XMLHttpRequest) {

                            messageText = oTextBundle.getText("BU_MSG_WSDeleteOK", oModelData.name);
                            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, messageText);

                            that.fireUpdate();
                            that.fireWorkspaceDeleted([ oModelData.workspaceId ]);

                            // var aWorkspacesSelected = sap.ui.getCore().getModel("WorkspaceSelected").getData();
                            sap.secmon.ui.browse.utils.postJSon("/sap/secmon/services/replication/export.xsjs", JSON.stringify({
                                "ObjectType" : "Workspace",
                                "Id" : oModelData.workspaceId,
                                "ObjectName" : oModelData.name,
                                "ObjectNamespace" : oModelData.namespace,
                                "Operation" : "Delete"
                            })).done(function(response, textStatus, XMLHttpRequest) {
                            }).fail(function(jqXHR, textStatus, errorThrown) {
                                if (errorThrown !== "abort") {
                                    messageText = oTextBundle.getText("BU_MSG_WSTranspDelFailed", oModelData.name) + ": " + jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                                }
                            });
                            // remove the last ', '
                            sAffectedPatternNames = sAffectedPatternNames.substr(0, sAffectedPatternNames.length - 2);
                        });

                        promise.fail(function(jqXHR, textStatus, errorThrown) {
                            if (errorThrown !== "abort") {
                                var errorWithoutStatus = oTextBundle.getText("BU_MSG_WSDeleteFailed", oModelData.name) + ": " + jqXHR.responseText;
                                var errorWithStatus = oTextBundle.getText("BU_MSG_WSDeleteFailed", oModelData.name) + ": " + jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                                messageText = jqXHR.status === 500 ? errorWithoutStatus : errorWithStatus;
                                sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                            }
                        });
                    }
                });
            }
        }
    },

    /**
     * handler for workspace open
     * 
     * @memberOf sap.secmon.ui.browse.WorkspaceExplorer
     */
    _handleWorkspaceOpen : function(oEvent) {
        var oWorkspaceSelectedData = sap.ui.getCore().getModel("WorkspacesSelected").getData()[0];
        var sWorkspaceId = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oWorkspaceSelectedData.Id);
        this.fireOpenWorkspace({
            workspaceId : sWorkspaceId,
            serializedData : oWorkspaceSelectedData.SerializedData
        });
    },

    /**
     * handler for workspace download
     * 
     * @memberOf sap.secmon.ui.browse.WorkspaceExplorer
     */
    _handleWorkspaceDownload : function(oEvent) {
        var aWorkspacesSelected = sap.ui.getCore().getModel("WorkspacesSelected").getData();

        var document = oEvent.getSource().getDomRef().ownerDocument;
        var downloadLink = document.createElement("a");

        aWorkspacesSelected.forEach(function(oWorkspaceSelectedData) {
            var sWorkspaceId = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oWorkspaceSelectedData.Id);
            downloadLink.href = sap.secmon.ui.browse.Constants.C_DOWNLOAD_WORKSPACE_PATH + sWorkspaceId;
            downloadLink.download = oWorkspaceSelectedData.Name + ".json";

            var mapInput = document.createElement("input");
            mapInput.setAttribute("type", "hidden");
            mapInput.setAttribute("name", "param1");
            mapInput.setAttribute("value", "fff");

            downloadLink.appendChild(mapInput);
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        });
    },

    /**
     * handler for workspace export
     * 
     * @memberOf sap.secmon.ui.browse.WorkspaceExplorer
     */
    _handleWorkspaceExport : function(oEvent) {
        var aWorkspacesSelected = sap.ui.getCore().getModel("WorkspacesSelected").getData();

        var document = oEvent.getSource().getDomRef().ownerDocument;

        sap.ui.commons.MessageBox.confirm(oTextBundle.getText("BU_MSG_WSExport"), fnCallbackExportWSConfirm, oTextBundle.getText("BU_TIT_WSExport"));
        function fnCallbackExportWSConfirm(bResult) {
            if (bResult) {
                var downloadLink = document.createElement("a");
                downloadLink.addEventListener("click", function() {
                    aWorkspacesSelected.forEach(function(oWorkspaceSelectedData) {
                        sap.secmon.ui.browse.utils.postJSon("/sap/secmon/services/replication/export.xsjs", JSON.stringify({
                            "ObjectType" : "Workspace",
                            "ObjectName" : oWorkspaceSelectedData.Name,
                            "ObjectNamespace" : oWorkspaceSelectedData.Namespace
                        })).done(function(response, textStatus, XMLHttpRequest) {
                            var messageText = oTextBundle.getText("BU_MSG_WSExportOk", oWorkspaceSelectedData.Name);
                            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, messageText);
                        }).fail(function(jqXHR, textStatus, errorThrown) {
                            var messageText = oTextBundle.getText("BU_MSG_WSExportFailed", oWorkspaceSelectedData.Namespace + ":" + oWorkspaceSelectedData.Name);
                            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, messageText);
                        });
                    });
                });

                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
        }

    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl); // writes the Control ID and enables
        oRm.writeClasses(); // there is no class to write, but this enables
        oRm.write(">");
        oRm.renderControl(oControl._layout);
        oRm.write("</div>"); // end of the complete Control
    },

    onAfterRendering : function() {

    },

    onBeforeRendering : function() {
    },

    rebuild : function() {
        this.oDataSet.setModel(new sap.ui.model.json.JSONModel());
        var sView = sap.ui.getCore().getModel("UISettings").getData().view;
        switch (sView) {
        case this.C_PRIVATE:
            this.oDataSet.setModel(sap.ui.getCore().getModel("WSListPrivate"));
            var oBinding = this.oDataSet.getBinding("items");
            var sUserName = this.getModel("applicationContext").getProperty("/userName");
            oBinding.filter([ new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, sUserName) ]);
            break;
        case this.C_SHARED:
            this.oDataSet.setModel(sap.ui.getCore().getModel("WSListPublished"));
            break;
        case this.C_ALL:
            this.oDataSet.setModel(sap.ui.getCore().getModel("WorkspaceListJSONModel"));
            break;
        }

        if (this.oDataSet.getModel().getData() && this.oDataSet.getModel().getData().length > 0) {
            sap.ui.getCore().byId("WSEmpty").setVisible(false);
        } else {
            sap.ui.getCore().byId("WSEmpty").setVisible(true);
        }

        if (this.searchTerm) {
            this.oDataSet.fireSearch({
                query : this.searchTerm
            });
        }

        this.oDataSet.setLeadSelection(-1);
    }
});
