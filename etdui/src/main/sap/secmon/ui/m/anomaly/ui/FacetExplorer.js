$.sap.declare("sap.secmon.ui.m.anomaly.ui.FacetExplorer");
$.sap.require("sap.secmon.ui.m.anomaly.ui.DataExplorer");
$.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");
$.sap.require("sap.secmon.ui.commons.Formatter");
$.sap.require("sap.ui.ux3.DataSet");
jQuery.sap.require("sap.ui.model.odata.CountMode");

/**
 * Custom control to provide a List of Facets.
 * 
 * @memberOf sap.secmon.ui.m.anomaly.ui.FacetExplorer
 */
sap.ui.core.Control.extend("sap.secmon.ui.m.anomaly.ui.FacetExplorer", {

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
            selectFacet : {
                data : "any"
            },
            facetListRetrieved : {
                status : "string"
            },
        }
    },

    _oDateFormatter : undefined,
    /**
     * @memberOf sap.secmon.ui.m.anomaly.ui.FacetExplorer
     */
    init : function() {
        var _that = this;
        // Locale settings + Date formatter
        this._sLocale = sap.ui.getCore().getConfiguration().getLanguage();
        this._oDateFormatter = sap.ui.core.format.DateFormat.getDateTimeInstance({
            locale : this._sLocale
        });
        var oModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/CommonUIText.hdbtextbundle",
            bundleLocale : sap.ui.getCore().getConfiguration().getLanguage()
        });
        this.setModel(oModel, "i18nCommon");

        oModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/anomaly/i18n/UIText.hdbtextbundle",
            bundleLocale : this._sLocale
        });
        this.setModel(oModel, "i18n");

        // Facet Selected
        var oFacetSelected = new sap.ui.model.json.JSONModel();
        this.setModel(oFacetSelected, "FacetSelected");

        // Facet List
        var oFacetList = new sap.ui.model.json.JSONModel();
        this.setModel(oFacetList, "FacetList");

        // Qube list
        var oQubeListModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.m.anomaly.ui.Constants.C_ODATA_QUBE_LIST_PATH, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.setModel(oQubeListModel, "QubeListModel");

        oQubeListModel.read("/Qube?$filter=Type eq 'Chart' and Published eq '1'", {
            success : function(oData, oResponse) {
                if (oData.results) {
                    var oFacets = [];

                    // update model with chartData
                    // sort result by name alphabetically
                    oData.results.sort(function(a, b) {
                        var nameA = a.Name.toUpperCase();
                        var nameB = b.Name.toUpperCase();
                        return (nameA < nameB) ? -1 : (nameA > nameB) ? 1 : 0;
                    });
                    $.each(oData.results, function(index, oResult) {
                        oFacets.push({
                            Id : new sap.secmon.ui.commons.CommonFunctions().base64ToHex(oResult.Id),
                            Name : oResult.Name,
                            CreationTimestamp : oResult.CreationTimestamp,
                            CreationByUserId : oResult.UserId,
                            ChangeTimestamp : oResult.ChangeTimestamp,
                            ChangedByUserId : oResult.ChangedByUserId,
                            Description : oResult.Description,
                            WorkspaceId : new sap.secmon.ui.commons.CommonFunctions().base64ToHex(oResult.ParentId),
                            Namespace : oResult.Namespace,
                            Search : oResult.Name + oResult.Namespace + oResult.UserId + oResult.ChangedByUserId + oResult.Description,
                            SerializedData : oResult.SerializedData,
                            Type : oResult.Type
                        });
                    });
                    _that.getModel("FacetList").setData(oFacets);
                    _that.fireFacetListRetrieved({
                        status : "S"
                    });
                }

            },
            error : function(oError) {
                this.fireFacetListRetrieved({
                    status : "E"
                });
            }
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

    /**
     * create toolbar for facet explorer
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FacetExplorer
     */
    _createToolbar : function() {
        var oToolbar = new sap.ui.commons.layout.MatrixLayout();
        oToolbar.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
            colSpan : 2,
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
     * @memberOf sap.secmon.ui.m.anomaly.ui.FacetExplorer
     */
    _createDataSet : function() {
        var _that = this;
        // this._oWorkspaceExplorer height = 80%
        // subtract contained rows to get left height for dataset
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
                name : "{i18nCommon>All_TXT}",
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
                var oFacet = _that.getModel("FacetSelected");
                var oFacetData = {};
                if (idx === -1 || idx === undefined) {
                    oFacet.setData({});

                } else {
                    var selectedObject = oEvent.getSource().getItems()[idx].getBindingContext().getObject();
                    // to be transformed to local time
                    oFacetData.ChangeTimestamp = selectedObject.ChangeTimestamp;
                    oFacetData.ChangedByUserId = selectedObject.ChangedByUserId;
                    // to be transformed to local time
                    oFacetData.CreationTimestamp = selectedObject.CreationTimestamp;
                    oFacetData.CreationByUserId = selectedObject.CreationByUserId;
                    oFacetData.Id = selectedObject.Id;
                    oFacetData.Name = selectedObject.Name;
                    oFacetData.Namespace = selectedObject.Namespace;
                    oFacetData.Description = selectedObject.Description;
                    oFacetData.Workspace = selectedObject.Workspace;
                    oFacetData.WorkspaceId = selectedObject.WorkspaceId;
                    oFacetData.Search = selectedObject.Search;
                    oFacetData.SerializedData = selectedObject.SerializedData;
                    oFacetData.Type = selectedObject.Type;
                    oFacet.setData(oFacetData);
                }
            }
        });
        this.oDataSet.setModel(this.getModel("FacetList"));
        oScrollContainer.addContent(this.oDataSet);
        oScrollContainer.addStyleClass("sapEtdBorderTopLine");

        return oScrollContainer;
    },

    /**
     * creates content and layout for available facets as templates
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FacetExplorer
     */
    _createTemplate : function() {
        var _that = this;
        return new sap.secmon.ui.m.anomaly.ui.DataExplorer({
            formTitel : new sap.ui.layout.HorizontalLayout({
                content : [ new sap.ui.core.Icon({
                    src : "sap-icon://multiple-line-chart",
                    tooltip : "{i18n>Chart_TXT}",
                    size : "1.5em",
                    width : "1.5em",
                    color : "#009DE0",
                    layoutData : new sap.ui.layout.form.GridElementData({
                        hCells : "2"
                    })
                }), new sap.ui.commons.Link({
                    text : {
                        parts : [ {
                            path : "Chart_TXT",
                            model : "i18n"
                        }, {
                            path : "Name",
                        } ],
                        formatter : function(sType, sName) {
                            if (sType && sName) {
                                return sType + ': ' + sName;
                            }
                        }
                    },
                    press : [ function(oEvent) {
                        var selectedObject = oEvent.getSource().getBindingContext().getObject();
                        var oFacet = _that.getModel("FacetSelected");
                        var oFacetData = {};
                        // to be transformed to local time
                        oFacetData.ChangeTimestamp = selectedObject.ChangeTimestamp;
                        oFacetData.ChangedByUserId = selectedObject.ChangedByUserId;
                        // to be transformed to local time
                        oFacetData.CreationTimestamp = selectedObject.CreationTimestamp;
                        oFacetData.CreationByUserId = selectedObject.CreationByUserId;
                        oFacetData.Id = selectedObject.Id;
                        oFacetData.Name = selectedObject.Name;
                        oFacetData.Namespace = selectedObject.Namespace;
                        oFacetData.Description = selectedObject.Description;
                        oFacetData.Workspace = selectedObject.Workspace;
                        oFacetData.WorkspaceId = selectedObject.WorkspaceId;
                        oFacetData.Search = selectedObject.Search;
                        oFacetData.SerializedData = selectedObject.SerializedData;
                        oFacetData.Type = selectedObject.Type;
                        oFacet.setData(oFacetData);
                        this._handleSelectFacet(oEvent);
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
                        fields : [ new sap.ui.commons.TextArea({
                            value : {
                                path : "Namespace",
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
                            height : "21px"
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
                            value : "{CreationByUserId}",
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
                                path : "CreationTimestamp",
                                formatter : function(value) {
                                    if (value) {
                                        return sap.secmon.ui.commons.Formatter.dateFormatterEx(value, _that.getShowUTC());
                                    } else {
                                        return "";
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
                            value : "{ChangedByUserId}",
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
                                path : "ChangeTimestamp",
                                formatter : function(value) {
                                    if (value) {
                                        return sap.secmon.ui.commons.Formatter.dateFormatterEx(value, _that.getShowUTC());
                                    } else {
                                        return "";
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
                            height : "110px"
                        }) ]
                    }) ]
                }) ]
            })
        });
    },
    /**
     * handler for facet selection
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.FacetExplorer
     */
    _handleSelectFacet : function(oEvent) {
        var oFacetSelectedData = this.getModel("FacetSelected").getData();
        this.fireSelectFacet({
            data : oFacetSelectedData
        });
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
    }
});
