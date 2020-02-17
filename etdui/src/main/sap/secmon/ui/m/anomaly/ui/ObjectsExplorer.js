$.sap.declare("sap.secmon.ui.m.anomaly.ui.ObjectsExplorer");
$.sap.require("sap.secmon.ui.m.anomaly.ui.DataExplorer");
$.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");

/**
 * Custom control to provide a list of objects.
 * 
 * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
 */
sap.ui.core.Control.extend("sap.secmon.ui.m.anomaly.ui.ObjectsExplorer", {

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
            },
            type : {
                type : "string",
                defaultValue : "All"
            },
            showUTC : {
                type : "boolean",
                defaultValue : false
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
            selectObject : {
                data : "any"
            },
            objectListRetrieved : {
                status : "string",
                msg : "string"
            },
            objectSelected : {
                data : "any"
            }
        }
    },

    _viewSelected : undefined,
    /**
     * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
     */
    init : function() {
        var _that = this;
        var oModelGen = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/CommonUIText.hdbtextbundle",
            bundleLocale : sap.ui.getCore().getConfiguration().getLanguage()
        });
        this.setModel(oModelGen, "i18nCommon");

        var oModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/anomaly/i18n/UIText.hdbtextbundle",
            bundleLocale : sap.ui.getCore().getConfiguration().getLanguage()
        });
        this.setModel(oModel, "i18n");

        var oUIModel = new sap.ui.model.json.JSONModel();
        this.setModel(oUIModel, "UIModel");

        // Object List
        var oObjectList = new sap.ui.model.json.JSONModel();
        this.setModel(oObjectList, "ObjectList");
        var oObjectSelected = new sap.ui.model.json.JSONModel();
        this.setModel(oObjectSelected, "ObjectSelected");
        var oObjectListScenario = new sap.ui.model.json.JSONModel();
        this.setModel(oObjectListScenario, "ObjectListScenario");
        var oObjectListFeature = new sap.ui.model.json.JSONModel();
        this.setModel(oObjectListFeature, "ObjectListFeature");
        var oObjectListPattern = new sap.ui.model.json.JSONModel();
        this.setModel(oObjectListPattern, "ObjectListPattern");
        // read and set model data
        this.refreshData();
        this._layout = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            height : "100%",
            layoutFixed : true,
            widths : [ "50%", "50%" ],
            columns : 2
        });

        // ToolBar => only show in case type = All
        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "25px",
        }).addCell(new sap.ui.commons.layout.MatrixLayoutCell({
            hAlign : sap.ui.commons.layout.HAlign.Begin,
            colSpan : 2,
            content : [ _that._createToolbar() ]
        }).addStyleClass("sapEtdFeatureCell")));

        // DataSet
        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "100%",
        }).addCell(new sap.ui.commons.layout.MatrixLayoutCell({
            hAlign : sap.ui.commons.layout.HAlign.Begin,
            vAlign : sap.ui.commons.layout.VAlign.Top,
            colSpan : 2,
            content : [ _that._createDataSet() ]
        }).addStyleClass("sapEtdFeatureCell")));

        // For spacing purpose
        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "5px",
        }).addCell(new sap.ui.commons.layout.MatrixLayoutCell({
            hAlign : sap.ui.commons.layout.HAlign.Begin,
            content : [ new sap.m.Label({
                text : ""
            }) ]
        })));

        this.setAggregation("_layout", this._layout);
    },

    getText : function(sTextKey) {
        var parameters = Array.prototype.slice.call(arguments, 0), model = this.getModel("i18n").getResourceBundle();
        return model.getText.apply(model, parameters);
    },

    /**
     * read data and set model data
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
     */
    refreshData : function() {
        var oObjectList = this.getModel("ObjectList");

        oObjectList.loadData(sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_OBJECT_LIST_PATH, null, false);

        var oObjectListData = oObjectList.getData();
        if (oObjectListData.anomalyObject) {
            var aObjects = [], aScenarios = [], aFeatures = [], aPatterns = [];
            // update model with chartData
            // sort result by name alphabetically
            oObjectListData.anomalyObject.sort(function(a, b) {
                var nameA = a.Name.toUpperCase();
                var nameB = b.Name.toUpperCase();
                return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
            });
            $.each(oObjectListData.anomalyObject, function(index, oResult) {
                var sFeatures = null, sPatterns = null;
                var sSearch = oResult.Name + oResult.Namespace;
                if (oResult.CreatedBy) {
                    sSearch = sSearch + oResult.CreatedBy;
                }
                if (oResult.ChangedBy) {
                    sSearch = sSearch + oResult.ChangedBy;
                }
                var bDetailsAvailable = false;
                if (oResult.Type === sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO) {
                    bDetailsAvailable = true;
                    // Feature Info
                    if (!oResult.Features) {
                        sFeatures = "n/a";
                    } else {
                        $.each(oResult.Features, function(index, oResult) {
                            if (sFeatures) {
                                sFeatures = sFeatures + ', ' + oResult.Name;
                            } else {
                                sFeatures = oResult.Name;
                            }
                        });
                        sSearch = sSearch + sFeatures;
                    }
                    // Pattern Info
                    if (!oResult.Patterns) {
                        sPatterns = "n/a";
                    } else {
                        $.each(oResult.Patterns, function(index, oResult) {
                            if (sPatterns) {
                                sPatterns = sPatterns + ', ' + oResult.Name;
                            } else {
                                sPatterns = oResult.Name;
                            }
                        });
                        sSearch = sSearch + sPatterns;
                    }
                }

                // All objects
                aObjects.push({
                    Id : oResult.Id,
                    Name : oResult.Name,
                    Namespace : oResult.Namespace,
                    Type : oResult.Type,
                    CreatedBy : oResult.CreatedBy,
                    CreatedAt : oResult.CreatedTimestamp,
                    ChangedBy : oResult.ChangedBy,
                    ChangedAt : oResult.ChangedTimestamp,
                    Features : sFeatures,
                    Patterns : sPatterns,
                    Description : oResult.Description,
                    Search : sSearch,

                    Details : bDetailsAvailable
                });
                switch (oResult.Type) {
                case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
                    // Scenarios
                    aScenarios.push({
                        Id : oResult.Id,
                        Name : oResult.Name,
                        Namespace : oResult.Namespace,
                        Type : oResult.Type,
                        CreatedBy : oResult.CreatedBy,
                        CreatedAt : oResult.CreatedTimestamp,
                        ChangedBy : oResult.ChangedBy,
                        ChangedAt : oResult.ChangedTimestamp,
                        Description : oResult.Description,
                        Features : sFeatures,
                        Patterns : sPatterns,
                        Search : sSearch,
                        Details : bDetailsAvailable
                    });
                    break;
                case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                    aFeatures.push({
                        Id : oResult.Id,
                        Name : oResult.Name,
                        Namespace : oResult.Namespace,
                        Type : oResult.Type,
                        CreatedBy : oResult.CreatedBy,
                        CreatedAt : oResult.CreatedTimestamp,
                        ChangedBy : oResult.ChangedBy,
                        ChangedAt : oResult.ChangedTimestamp,
                        Description : oResult.Description,
                        Features : sFeatures,
                        Patterns : sPatterns,
                        Search : sSearch,
                        Details : bDetailsAvailable
                    });
                    break;
                case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                    aPatterns.push({
                        Id : oResult.Id,
                        Name : oResult.Name,
                        Namespace : oResult.Namespace,
                        Type : oResult.Type,
                        CreatedBy : oResult.CreatedBy,
                        CreatedAt : oResult.CreatedTimestamp,
                        ChangedBy : oResult.ChangedBy,
                        ChangedAt : oResult.ChangedTimestamp,
                        Description : oResult.Description,
                        Features : sFeatures,
                        Patterns : sPatterns,
                        Search : sSearch,
                        Details : bDetailsAvailable
                    });
                    break;
                }
            });
            this.getModel("ObjectList").setData(aObjects);
            this.getModel("ObjectSelected").setData({});
            this.getModel("ObjectListScenario").setData(aScenarios);
            this.getModel("ObjectListFeature").setData(aFeatures);
            this.getModel("ObjectListPattern").setData(aPatterns);
            this.fireObjectListRetrieved({
                status : "S"
            });
        } else {
            this.fireObjectListRetrieved({
                status : "E"
            });
        }

    },
    /**
     * create toolbar for Object explorer
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
     */
    _createToolbar : function() {
        var _that = this;
        var oToolbar = new sap.ui.commons.layout.MatrixLayout();
        var oHLayout = new sap.ui.commons.layout.HorizontalLayout({
            visible : {
                path : "UIModel>/Type",
                formatter : function(sType) {
                    if (sType === 'All') {
                        return true;
                    } else {
                        return false;
                    }
                }
            }
        });

        oHLayout.addContent(new sap.m.Button({
            text : "{i18n>All_TXT}",
            icon : sap.ui.core.IconPool.getIconURI("list"),
            tooltip : "{i18n>ShowAll_TXT}",
            type : 'Transparent',
            style : sap.ui.commons.ButtonStyle.Emph,
            press : function(oEvent) {
                oEvent.getSource().setStyle(sap.ui.commons.ButtonStyle.Emph);
                this.getParent().getContent()[1].setStyle(sap.ui.commons.ButtonStyle.Default);
                this.getParent().getContent()[2].setStyle(sap.ui.commons.ButtonStyle.Default);
                this.getParent().getContent()[3].setStyle(sap.ui.commons.ButtonStyle.Default);
                _that._rebuild(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.ALL);
            }
        }));

        oHLayout.addContent(new sap.m.Button({
            text : "{i18n>Scenarios_TXT}",
            icon : sap.ui.core.IconPool.getIconURI("upstacked-chart"),
            tooltip : "{i18n>ShowScenarios_TXT}",
            type : 'Transparent',
            press : function(oEvent) {
                oEvent.getSource().setStyle(sap.ui.commons.ButtonStyle.Emph);
                this.getParent().getContent()[0].setStyle(sap.ui.commons.ButtonStyle.Default);
                this.getParent().getContent()[2].setStyle(sap.ui.commons.ButtonStyle.Default);
                this.getParent().getContent()[3].setStyle(sap.ui.commons.ButtonStyle.Default);
                _that._rebuild(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO);
            }
        }));

        oHLayout.addContent(new sap.m.Button({
            text : "{i18n>Evaluations_TXT}",
            icon : sap.ui.core.IconPool.getIconURI("bar-chart"),
            tooltip : "{i18n>ShowEvaluations_TXT}",
            type : 'Transparent',
            press : function(oEvent) {
                oEvent.getSource().setStyle(sap.ui.commons.ButtonStyle.Emph);
                this.getParent().getContent()[0].setStyle(sap.ui.commons.ButtonStyle.Default);
                this.getParent().getContent()[1].setStyle(sap.ui.commons.ButtonStyle.Default);
                this.getParent().getContent()[3].setStyle(sap.ui.commons.ButtonStyle.Default);
                _that._rebuild(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE);
            }
        }));
        oHLayout.addContent(new sap.m.Button({
            text : "{i18n>Patterns_TXT}",
            icon : sap.ui.core.IconPool.getIconURI("puzzle"),
            tooltip : "{i18n>ShowPatterns_TXT}",
            type : 'Transparent',
            press : function(oEvent) {
                oEvent.getSource().setStyle(sap.ui.commons.ButtonStyle.Emph);
                this.getParent().getContent()[0].setStyle(sap.ui.commons.ButtonStyle.Default);
                this.getParent().getContent()[1].setStyle(sap.ui.commons.ButtonStyle.Default);
                this.getParent().getContent()[2].setStyle(sap.ui.commons.ButtonStyle.Default);
                _that._rebuild(sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN);
            }
        }));

        oToolbar.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 1,
            vAlign : sap.ui.commons.layout.VAlign.Bottom,
            hAlign : sap.ui.commons.layout.HAlign.Begin,
            content : [ new sap.m.Label({
                text : {
                    path : "Search_LBL",
                    model : "i18nCommon",
                    formatter : function(sSearch) {
                        return sSearch + ' :';
                    }
                },
                width : "70px"
            }), new sap.ui.commons.SearchField({
                enableListSuggest : false,
                enableFilterMode : true,
                width : "300px",
                search : [ function(oEvent) {
                    this.oDataSet.fireSearch({
                        query : oEvent.getParameter("query")
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
     * returns selected data
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
     */
    getSelectedObject : function() {
        return this.getModel("ObjectSelected").getData();
    },
    /**
     * create content and layout for available workspaces
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
     */
    _rebuild : function(sView) {

        switch (sView) {
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.ALL:
            this.oDataSet.setModel(this.getModel("ObjectList"));
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
            this.oDataSet.setModel(this.getModel("ObjectListScenario"));
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
            this.oDataSet.setModel(this.getModel("ObjectListFeature"));
            break;
        case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
            this.oDataSet.setModel(this.getModel("ObjectListPattern"));
            break;
        }
        this.oDataSet.setLeadSelection(-1);
    },

    /**
     * create content and layout for available workspaces
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
     */
    _applyPatternFilter : function(oFilter) {

        var oObjectListPattern = this.getModel("ObjectListPattern");
        var oObjectListPatternData = oObjectListPattern.getData();
        for (var i = (oObjectListPatternData.length - 1); i >= 0; i--) {
            for (var j = 0; j < oFilter.ExclusionList.length; j++) {
                if (oObjectListPatternData[i].Id === oFilter.ExclusionList[j]) {
                    oObjectListPatternData.splice(i, 1);
                    break;
                }
            }
        }
        oObjectListPattern.setData(oObjectListPatternData);
    },
    /**
     * create content and layout for available workspaces
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
     */
    _createDataSet : function() {
        var _that = this;
        // subtract contained rows to get left height for
        // dataset
        var height = ($(document).height() * 0.8 - 150) + "px";

        var oScrollContainer = new sap.m.ScrollContainer({
            horizontal : false,
            vertical : true,
            height : height
        });
        // DataSet Private as default
        this.oDataSet = new sap.ui.ux3.DataSet({
            showToolbar : false,
            showSearchField : true,
            items : {
                path : "/",
                template : new sap.ui.ux3.DataSetItem()
            },
            views : [ new sap.ui.ux3.DataSetSimpleView({
                icon : "sap-icon://multiple-line-chart",
                iconHovered : "sap-icon://multiple-line-chart",
                iconSelected : "sap-icon://multiple-line-chart",
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
            selectionChanged : [ function(oEvent) {
                var idx = oEvent.getParameter("newLeadSelectedIndex");
                if (idx === -1 || idx === undefined) {
                    // disable deletion button
                    _that._handleObjectSelected();
                    this.getModel("ObjectSelected").setData({});
                } else {
                    var selectedObject = oEvent.getSource().getModel().getProperty(oEvent.getSource().getItems()[idx].getBindingContext().getPath());
                    _that.getModel("ObjectSelected").setData(selectedObject);
                    _that._handleObjectSelected(selectedObject);
                }
            }, this ]
        });
        var sObjectType = 'ObjectList'; // default = All
        switch (this.getType()) {
        case 'Scenario':
            sObjectType = 'ObjectListScenario';
            break;
        case 'Feature':
            sObjectType = 'ObjectListFeature';
            break;
        case 'Pattern':
            sObjectType = 'ObjectListPattern';
            break;

        }
        this.oDataSet.setModel(this.getModel(sObjectType));
        oScrollContainer.addContent(this.oDataSet);
        oScrollContainer.addStyleClass("sapEtdBorderTopLine");

        return oScrollContainer;
    },

    /**
     * creates content and layout for available Objects as templates
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
     */
    _createTemplate : function() {
        var _that = this;
        var oTextBundleTmp = jQuery.sap.resources({
            url : "/sap/secmon/ui/m/anomaly/i18n/UIText.hdbtextbundle",
            locale : this._sLocale
        });
        return new sap.secmon.ui.m.anomaly.ui.DataExplorer({
            formTitel : new sap.ui.layout.HorizontalLayout({
                content : [ new sap.ui.core.Icon({
                    src : {
                        path : "Type",
                        formatter : function(value) {
                            switch (value) {
                            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
                                return "sap-icon://upstacked-chart";
                            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                                return "sap-icon://bar-chart";
                            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                                return "sap-icon://puzzle";
                            }
                        }
                    },
                    tooltip : {
                        path : "Type",
                        formatter : function(value) {
                            switch (value) {
                            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.SCENARIO:
                                return oTextBundleTmp.getText("Scenario_TXT");
                            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                                return oTextBundleTmp.getText("Evaluation_TXT");
                            case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                                return oTextBundleTmp.getText("Pattern_TXT");
                            }
                        }
                    },
                    size : "1.5em",
                    width : "1.5em",
                    color : "#009DE0",
                    layoutData : new sap.ui.layout.form.GridElementData({
                        hCells : "2"
                    })
                }), new sap.ui.commons.Link({
                    text : {
                        parts : [ {
                            path : "Type"
                        }, {
                            path : "Name",
                        } ],
                        formatter : function(sType, sName) {
                            if (sType && sName) {
                                var sObjectType = _that.getText("Scenario_TXT");
                                switch (sType) {
                                case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE:
                                    sObjectType = _that.getText("Evaluation_TXT");
                                    break;
                                case sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.PATTERN:
                                    sObjectType = _that.getText("Pattern_TXT");
                                    break;
                                }
                                return sObjectType + ': ' + sName;
                            }
                        }
                    },
                    press : [ function(oEvent) {
                        var selectedObject = oEvent.getSource().getBindingContext().getObject();
                        var oObjectData = {};
                        oObjectData.Type = selectedObject.Type;
                        oObjectData.Name = selectedObject.Name;
                        oObjectData.Namespace = selectedObject.Namespace;
                        oObjectData.Id = selectedObject.Id;
                        this._handleSelectObject(oObjectData);
                    }, this ]
                }) ]

            }),
            formInfo : new sap.ui.layout.form.Form({
                width : "100%",
                layout : new sap.ui.layout.form.GridLayout(),
                formContainers : [ new sap.ui.layout.form.FormContainer({
                    formElements : [ new sap.ui.layout.form.FormElement({
                        label : new sap.m.Label({
                            text : {
                                path : "Namespace_LBL",
                                model : "i18nCommon",
                                formatter : function(sValue) {
                                    return sValue;
                                }
                            },
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "5"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextField({
                            value : "{Namespace}",
                            editable : false
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        label : new sap.m.Label({
                            text : {
                                path : "Created_By_LBL",
                                model : "i18nCommon",
                                formatter : function(sValue) {
                                    return sValue;
                                }
                            },
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "5"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextField({
                            value : {
                                path : "CreatedBy",
                                formatter : function(value) {
                                    if (value) {
                                        return value;
                                    } else {
                                        return "n/a";
                                    }
                                }
                            },
                            editable : false
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        label : new sap.m.Label({
                            text : {
                                path : "Created_At_LBL",
                                model : "i18nCommon",
                                formatter : function(sValue) {
                                    return sValue;
                                }
                            },
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "5"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextField({
                            value : {
                                path : "CreatedAt",
                                formatter : function(value) {
                                    if (value) {
                                        return sap.secmon.ui.commons.Formatter.dateFormatterEx(value, _that.getShowUTC());
                                    } else {
                                        return "n/a";
                                    }
                                }
                            },
                            editable : false
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        label : new sap.m.Label({
                            text : {
                                path : "Changed_By_LBL",
                                model : "i18nCommon",
                                formatter : function(sValue) {
                                    return sValue;
                                }
                            },
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "5"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextField({
                            value : {
                                path : "ChangedBy",
                                formatter : function(value) {
                                    if (value) {
                                        return value;
                                    } else {
                                        return "n/a";
                                    }
                                }
                            },
                            editable : false
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        label : new sap.m.Label({
                            text : {
                                path : "Changed_At_LBL",
                                model : "i18nCommon",
                                formatter : function(sValue) {
                                    return sValue;
                                }
                            },
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "5"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextField({
                            value : {
                                path : "ChangedAt",
                                formatter : function(value) {
                                    if (value) {
                                        return sap.secmon.ui.commons.Formatter.dateFormatterEx(value, _that.getShowUTC());
                                    } else {
                                        return "n/a";
                                    }
                                }
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
                        label : new sap.m.Label({
                            text : {
                                path : "Description_LBL",
                                model : "i18nCommon",
                                formatter : function(sValue) {
                                    return sValue;
                                }
                            },
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "2",
                                vCells : 2
                            })
                        }),
                        fields : [ new sap.ui.commons.TextArea({
                            value : {
                                path : "Description",
                                formatter : function(value) {
                                    if (value) {
                                        return value;
                                    } else {
                                        return "n/a";
                                    }
                                }
                            },
                            editable : false,
                            wrapping : sap.ui.core.Wrapping.Hard,
                            width : "100%",
                            height : {
                                path : "Details",
                                formatter : function(value) {
                                    if (value) {
                                        return "22px";
                                    } else {
                                        return "110px";
                                    }
                                }
                            }
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
                        visible : {
                            path : "Details",
                            formatter : function(value) {
                                if (value) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                        },
                        label : new sap.m.Label({
                            text : {
                                path : "Evaluations_LBL",
                                model : "i18n",
                                formatter : function(sValue) {
                                    return sValue;
                                }
                            },
                            layoutData : new sap.ui.layout.form.GridElementData({
                                hCells : "2"
                            })
                        }),
                        fields : [ new sap.ui.commons.TextArea({
                            value : {
                                path : "Features",
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
                        visible : {
                            path : "Details",
                            formatter : function(value) {
                                if (value) {
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                        },
                        label : new sap.m.Label({
                            text : {
                                path : "Patterns_LBL",
                                model : "i18n",
                                formatter : function(sValue) {
                                    return sValue;
                                }
                            },
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
            })
        });
    },
    /**
     * handler for Object selection
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
     */
    _handleSelectObject : function(oSelected) {
        this.fireSelectObject({
            data : oSelected
        });
    },

    /**
     * handler for Object deletion
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.ObjectsExplorer
     */
    _handleObjectSelected : function(oSelected) {
        this.fireObjectSelected({
            data : oSelected
        });
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl); // writes the Control ID
        // and enables
        oRm.writeClasses(); // there is no class to write, but
        // this enables
        oRm.write(">");
        oRm.renderControl(oControl._layout);
        oRm.write("</div>"); // end of the complete Control
    },

    onAfterRendering : function() {
    },

    onBeforeRendering : function() {
        // update UI based on UI Model
        var oModel = this.getModel("UIModel");
        var oData = oModel.getData();
        oData.Type = this.getType();
        oModel.setData(oData);
        this._rebuild(this.getType());
    }
});