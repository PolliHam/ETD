$.sap.declare("sap.secmon.ui.m.anomaly.ui.FeatureExplorer");
$.sap.require("sap.secmon.ui.m.anomaly.ui.DataExplorer");
$.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");

/**
 * Custom control to provide a list of objects.
 * 
 * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureExplorer
 */
sap.ui.core.Control.extend("sap.secmon.ui.m.anomaly.ui.FeatureExplorer", {

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
            filters : {
                type : "any",
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
            ObjectListRetrieved : {
                status : "string",
                msg : "string"
            },
        }
    },

    _viewSelected : undefined,
    /**
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureExplorer
     */
    init : function() {
        var _that = this;

        // Feature List
        var oFeatureList = new sap.ui.model.json.JSONModel();
        oFeatureList.setSizeLimit(3000);
        this.setModel(oFeatureList, "FeatureList");

        this._layout = new sap.ui.commons.layout.MatrixLayout({
            width : "100%",
            height : "100%",
            layoutFixed : true,
            widths : [ "50%", "50%" ],
            columns : 2
        });

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
        // ToolBar
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
     * create toolbar for Object explorer
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureExplorer
     */
    _createToolbar : function() {
        var oToolbar = new sap.ui.commons.layout.MatrixLayout();
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
        }));

        return oToolbar;
    },
    /**
     * create content and layout for available workspaces
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureExplorer
     */
    _createDataSet : function() {
        // this._oWorkspaceExplorer height = 80%
        // subtract contained rows to get left height for
        // dataset
        var height = ($(document).height() * 0.8 - 150) + "px";

        var oScrollContainer = new sap.m.ScrollContainer({
            horizontal : false,
            vertical : true,
            height : height
        });
        // DataSet All as default
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
            selectionChanged : function search(oEvent) {
                var idx = oEvent.getParameter("newLeadSelectedIndex");
                var oObjectData = {};
                if (idx === -1 || idx === undefined) {
                    // oObject.setData({});

                } else {
                    var selectedObject = oEvent.getSource().getItems()[idx].getBindingContext().getObject();
                    oObjectData.Name = selectedObject.Name;
                    oObjectData.Namespace = selectedObject.Namespace;
                    oObjectData.Search = selectedObject.Search;
                    // oObject.setData(oObjectData);
                }
            }
        });
        this.oDataSet.setModel(this.getModel("FeatureList"));
        oScrollContainer.addContent(this.oDataSet);
        oScrollContainer.addStyleClass("sapEtdBorderTopLine");

        return oScrollContainer;
    },

    /**
     * creates content and layout for available Objects as templates
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureExplorer
     */
    _createTemplate : function() {
        var _that = this;
        return new sap.secmon.ui.m.anomaly.ui.DataExplorer({
            formTitel : new sap.ui.layout.HorizontalLayout({
                content : [ new sap.ui.core.Icon({
                    src : "sap-icon://bar-chart",
                    tooltip : {
                        path : "Type",
                        formatter : function(sValue) {
                            if (sValue) {
                                return _that.getText("Evaluation_TXT");
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
                                var res = _that.getText("Evaluation_TXT") + ': ' + sName;
                                return res;
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
                                path : "ChangeAt",
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
                                path : "IsAlreadyAss_LBL",
                                model : "i18n",
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
                                path : "AlreadyAssigned",
                                formatter : function(value) {
                                    if (value === true) {
                                        return _that.getText("Yes_TXT");
                                    } else {
                                        return _that.getText("No_TXT");
                                    }
                                }
                            },
                            editable : false,
                            wrapping : sap.ui.core.Wrapping.Hard,
                            width : "100%",
                            height : "22px"
                        }) ]
                    }), new sap.ui.layout.form.FormElement({
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
                            height : "88px"
                        }) ]
                    }) ]
                }) ]
            })
        });
    },
    /**
     * handler for Object selection
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FeatureExplorer
     */
    _handleSelectObject : function(oSelected) {
        this.fireSelectObject({
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

        var aFilter = this.getFilters();
        var oFeatureList = this.getModel("FeatureList");
        var URL = sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_OBJECT_LIST_PATH + '?Type=' + sap.secmon.ui.m.anomaly.ui.Constants.C_OBJECT_TYPE.FEATURE;
        if (aFilter && aFilter.length > 0 && aFilter[0].Type !== null && aFilter[0].Id !== null) {
            URL = sap.secmon.ui.m.anomaly.ui.Constants.C_ANOMALY_OBJECT_LIST_PATH + '?Type=' + aFilter[0].Type + '&Id=' + aFilter[0].Id;
        }
        oFeatureList.loadData(URL, null, false);
        var oFeatureListData = oFeatureList.getData();
        if (oFeatureListData.anomalyObject.length > 0) {
            var aFeatures = [];
            // update model with chartData
            // sort result by name alphabetically
            oFeatureListData.anomalyObject.sort(function(a, b) {
                var nameA = a.Name.toUpperCase();
                var nameB = b.Name.toUpperCase();
                return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
            });
            $.each(oFeatureListData.anomalyObject, function(index, oResult) {
                // exclusionList
                var skip = false;
                if (aFilter) {
                    for (var i = 0; i < aFilter.length; i++) {
                        if (aFilter[i].Id === oResult.Id) {
                            skip = true;
                            break;
                        }
                    }
                }
                var sSearch = oResult.Name + oResult.Namespace;
                if (oResult.CreatedBy) {
                    sSearch = sSearch + oResult.CreatedBy;
                }
                if (oResult.ChangedBy) {
                    sSearch = sSearch + oResult.ChangedBy;
                }
                if (oResult.Description) {
                    sSearch = sSearch + oResult.Description;
                }
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
                    Search : sSearch,
                    AlreadyAssigned : skip
                });
            });
            oFeatureList.setData(aFeatures);
            this.fireObjectListRetrieved({
                status : "S",
                msg : "List successfully retrieved"
            });
        }
    }
});
