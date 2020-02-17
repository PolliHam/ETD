/* globals oTextBundle, d3 */
$.sap.declare("sap.secmon.ui.browse.PatternDefinition");

$.sap.require("sap/ui/thirdparty/d3");
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.browse.Chart");
$.sap.require("sap.secmon.ui.browse.utils");
jQuery.sap.require("sap.ui.model.odata.CountMode");

/**
 * Custom control to provide pattern specific functionalities based on Chart. PatternDefinition inherits from Chart. Threshold is drawn with direct access of d3 layer which VizChart uses. Other
 * properties of a pattern are rendered as an array of inputfields.
 * 
 * @see Chart
 */

sap.secmon.ui.browse.PatternDefinitionRenderer = sap.ui.core.Renderer.extend(sap.secmon.ui.browse.ChartRenderer);

sap.secmon.ui.browse.Chart.extend("sap.secmon.ui.browse.PatternDefinition", {

    metadata : {
        properties : {
            threshold : {
                type : "int",
                defaultValue : 1
            },

            animationDuration : {
                type : "int",
                defaultValue : 500
            },

            availableTypes : {
                type : "object",
                defaultValue : [ sap.secmon.ui.browse.Constants.C_CHART_TYPE.COLUMN, sap.secmon.ui.browse.Constants.C_CHART_TYPE.LINE ]
            },
        },

        aggregations : {},

        events : {}
    },

    _mapBackendService : undefined,

    _publishPatternChanged : function(oParams) {
        sap.ui.getCore().getEventBus().publish(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_PATTERN_CHANGED, oParams);
    },

    init : function() {
        var sKey;
        if (sap.secmon.ui.browse.Chart.prototype.init) {
            sap.secmon.ui.browse.Chart.prototype.init.call(this);
        }

        this._mapBackendService = {
            "WRKFL" : {
                model : new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_ALL_PATTERNS, {
                    json : true,
                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                }),
                path : "/TriggerPattern",
            },
            "SEMEV" : {
                model : new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_ALL_SEMANTIC_EVENTS, {
                    json : true,
                    defaultCountMode : sap.ui.model.odata.CountMode.Inline
                }),
                path : "/SemanticEvent",
            },
        };

        // Model def for triggers either semantic events or patterns
        var oAvailableTriggersModel = new sap.ui.model.json.JSONModel();
        oAvailableTriggersModel.setSizeLimit(sap.secmon.ui.browse.Constants.C_MODEL_SIZE_LIMIT.TRIGGER_LIST);
        this.setModel(oAvailableTriggersModel, "AvailableTriggersModel");

        // show other pattern related properties
        var oPropertyPane = this._layout.getBegin().getContent()[0];

        oPropertyPane.removeContent(2);

        var iProeprtyIndex = 0;

        // Status
        oPropertyPane.insertContent(new sap.ui.commons.Label({
            text : oTextBundle.getText("Ptn_Exec_Result_Status"),
        }), iProeprtyIndex++);

        oPropertyPane.insertContent(new sap.ui.commons.DropdownBox({
            selectedKey : "{/status}",
            items : {
                path : "enums>/sap.secmon.ui.browse/Pattern/Status/enumValues",
                template : new sap.ui.core.ListItem({
                    key : "{enums>Key}",
                    text : "{enums>Value}"
                })
            },
            change : [
                    function(oEvent) {
                        if (oEvent.getSource().getSelectedKey() === "ACTIVE" && !this.getModel().getProperty("/shared")) {
                            sap.ui.commons.MessageBox.show(oTextBundle.getText("BU_MSG_W_SharePattern", this.getModel().getProperty("/name")), sap.ui.commons.MessageBox.Icon.WARNING, oTextBundle
                                    .getText("BU_LBL_Pattern"), sap.ui.commons.MessageBox.Action.OK);
                        }
                        this._publishPatternChanged({
                            luid : oEvent.getSource().getModel().getProperty("/luid")
                        });
                    }, this ]
        }), iProeprtyIndex++);

        // Execution Output
        oPropertyPane.insertContent(new sap.ui.commons.Label({
            text : oTextBundle.getText("BU_LBL_ExecutionOutput"),
        }), iProeprtyIndex++);

        oPropertyPane.insertContent(new sap.ui.commons.DropdownBox({
            selectedKey : "{/executionOutput}",
            items : {
                path : "enums>/sap.secmon.ui.browse/Pattern/ExecutionOutput/enumValues",
                template : new sap.ui.core.ListItem({
                    key : "{enums>Key}",
                    text : "{enums>Value}"
                })
            },
            change : [ function(oEvent) {
                this._publishPatternChanged({
                    luid : oEvent.getSource().getModel().getProperty("/luid")
                });
            }, this ]
        }), iProeprtyIndex++);

        iProeprtyIndex += 2;

        oPropertyPane.insertContent(new sap.ui.commons.Label({
            text : oTextBundle.getText("BU_LBL_Threshold"),
        }), iProeprtyIndex++);

        // Threshold operators
        var aThresholdOperator = [ "=", ">", "<", "<=", ">=" ];
        var sDefaultThresholdOperator = ">=";

        var oCombox = new sap.m.ComboBox({
            selectedKey : {
                path : "/thresholdOperator",
                mode : sap.ui.model.BindingMode.TwoWay, // "TwoWay",
                formatter : function(sValue) {
                    return sValue || sDefaultThresholdOperator;
                }
            },
            change : [ function(oEvent) {
                // Databinding is broken always setup as OneWay. should work since UI5 v. 1.44
                // @TODO make a workaround
                oEvent.getSource().getModel().setProperty("/thresholdOperator", oEvent.getSource().getSelectedKey());
                this._publishPatternChanged({
                    luid : oEvent.getSource().getModel().getProperty("/luid")
                });
            }, this ]
        });

        aThresholdOperator.forEach(function(op) {
            oCombox.addItem(new sap.ui.core.ListItem({
                key : op,
                text : op
            }));
        });

        oPropertyPane.insertContent(new sap.m.HBox({
            items : [ oCombox, new sap.m.Input({
                value : {
                    path : "/threshold",
                    type : new sap.ui.model.type.Integer({
                        maxFractionDigits : 0,
                    })
                },
                change : [ function(oEvent) {
                    var oThreshold = oEvent.getSource();
                    if (oThreshold.getValue() > 0) {
                        // refresh the model so that rerendering is forced
                        oThreshold.getModel().refresh(true);
                        this._publishPatternChanged({
                            luid : oThreshold.getModel().getProperty("/luid")
                        });
                        oThreshold.setValueState(sap.ui.core.ValueState.None);
                    } else {
                        oThreshold.setValueState(sap.ui.core.ValueState.Error);
                    }
                }, this ]
            }) ]
        }), iProeprtyIndex++);

        iProeprtyIndex += 3;

        // divider
        oPropertyPane.insertContent(new sap.ui.commons.HorizontalDivider(), iProeprtyIndex++);

        var oSimpleFormTrigger = new sap.ui.layout.form.SimpleForm({});
        var _oTriggerPanel = new sap.ui.commons.Panel({
            borderDesign : sap.ui.commons.enums.BorderDesign.Box,
            collapsed : false,
            content : oSimpleFormTrigger,
            title : new sap.ui.core.Title({
                text : oTextBundle.getText("BU_TIT_Execution"),
                level : sap.ui.core.TitleLevel.H6
            })
        });

        // mark it to avoid paddings
        _oTriggerPanel.addStyleClass("sapEtdNoPadding");

        oSimpleFormTrigger.addContent(new sap.ui.commons.DropdownBox({
            enabled : "{/execTypeEditable}",
            selectedKey : "{/executionType}",
            items : [ {
                key : sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.SCHEDULED,
                text : oTextBundle.getText("BU_LBL_Scheduled"),
            }, {
                key : sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.TRIGGERED,
                text : oTextBundle.getText("BU_LBL_Triggered"),
            } ],
            change : [ function(oEvent) {
                this._publishPatternChanged({
                    luid : oEvent.getSource().getModel().getProperty("/luid")
                });
                this.loadTriggersModel();
            }, this ]
        }));
        oSimpleFormTrigger.addContent(new sap.ui.commons.Label({
            text : oTextBundle.getText("PCE_Frequency"),
            visible : {
                path : "/executionType",
                formatter : function(sValue) {
                    return !sValue || sValue === sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.SCHEDULED;
                }
            }
        }));
        oSimpleFormTrigger.addContent(new sap.ui.commons.TextField({
            visible : {
                path : "/executionType",
                formatter : function(sValue) {
                    return !sValue || sValue === sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.SCHEDULED;
                }
            },
            value : {
                path : "/frequency",
                type : new sap.ui.model.type.Integer({
                    maxFractionDigits : 0,
                })
            },
            change : [ function(oEvent) {
                var oFrequency = oEvent.getSource();
                var oModelData = this.getModel().getData();
                if (oFrequency.getValue() > 0) {
                    sap.secmon.ui.browse.utils.checkPatternFrequency(oModelData);
                    this._publishPatternChanged({
                        luid : oFrequency.getModel().getProperty("/luid")
                    });
                    oFrequency.setValueState(sap.ui.core.ValueState.None);
                } else {
                    oFrequency.setValueState(sap.ui.core.ValueState.Error);
                }
            }, this ]
        }));

        oSimpleFormTrigger.addContent(new sap.ui.commons.Label({
            visible : {
                path : "/executionType",
                formatter : function(sValue) {
                    return sValue === sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.TRIGGERED;
                }
            },
            text : oTextBundle.getText("BU_LBL_By"),
        }));
        oSimpleFormTrigger.addContent(new sap.ui.commons.DropdownBox({
            enabled : "{/execTypeEditable}",
            visible : {
                path : "/executionType",
                formatter : function(sValue) {
                    return sValue === sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.TRIGGERED;
                }
            },
            selectedKey : "{/triggerType}",
            items : [ {
                key : sap.secmon.ui.browse.Constants.C_PATTERN_TRIGGER_TYPE.EVENT,
                text : oTextBundle.getText("BU_LBL_Event"),
            }, {
                key : sap.secmon.ui.browse.Constants.C_PATTERN_TRIGGER_TYPE.PATTERN,
                text : oTextBundle.getText("BU_LBL_Pattern"),
            } ],
            change : [ function(oEvent) {
                this.getModel().getProperty("/triggers").length = 0;
                this._publishPatternChanged({
                    luid : oEvent.getSource().getModel().getProperty("/luid")
                });
                this.loadTriggersModel();
            }, this ]
        }));

        // Triggers
        var oTriggerRowTemplate = new sap.ui.commons.layout.MatrixLayout({
            columns : 2,
            widths : [ "100%", "26px" ],
            width : "100%",
            rows : [ new sap.ui.commons.layout.MatrixLayoutRow({
                cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                    content : new sap.ui.commons.DropdownBox({
                        enabled : "{/execTypeEditable}",
                        // width : "140px",
                        selectedKey : "{TriggerName}",
                        items : {
                            path : "AvailableTriggersModel>/triggers",
                            template : new sap.ui.core.ListItem({
                                key : "{AvailableTriggersModel>key}",
                                text : "{AvailableTriggersModel>text}",
                            }),
                            sorter : new sap.ui.model.Sorter("text")
                        },
                        change : [ function(oEvent) {
                            this._publishPatternChanged({
                                luid : this.getModel().getProperty("/luid")
                            });
                            // TODO
                            this._publishWSChanged();
                        }, this ]
                    })
                }), new sap.ui.commons.layout.MatrixLayoutCell({
                    content : new sap.ui.commons.Button({
                        lite : true,
                        icon : sap.ui.core.IconPool.getIconURI("delete"),
                        tooltip : oTextBundle.getText("BU_TOL_DelTrigger"),
                        // enabled : {
                        // parts : [ {
                        // path : "/triggers"
                        // }, {
                        // path : "/execTypeEditable"
                        // } ],
                        // formatter : function(aVal, bExecTypeEditable) {
                        // return bExecTypeEditable && aVal && aVal.length > 1;
                        // }
                        // },
                        press : [ function(oEvent) {
                            this._handleTriggerDelete(oEvent);
                            this._publishPatternChanged({
                                luid : this.getModel().getProperty("/luid")
                            });
                            // TODO
                            this._publishWSChanged();
                        }, this ]
                    })
                }) ]
            }) ]
        });

        var oTriggersTable = new sap.ui.table.Table({
            visible : {
                path : "/executionType",
                formatter : function(sValue) {
                    return sValue === sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.TRIGGERED;
                }
            },
            visibleRowCount : {
                path : "/triggers",
                formatter : function(aVals) {
                    if (aVals === undefined) {
                        return 1;
                    } else {
                        return aVals.length;
                    }
                }
            },
            selectionMode : sap.ui.table.SelectionMode.None,
            columnHeaderVisible : false,
            columns : [ new sap.ui.table.Column({
                template : oTriggerRowTemplate
            }) ]
        });
        oTriggersTable.bindRows("/triggers");
        oTriggersTable.setModel(this.getModel());

        oTriggersTable.addStyleClass("sapEtdNoPadding");

        var oAddTriggerLink = new sap.ui.commons.Link({
            enabled : "{/execTypeEditable}",
            visible : {
                path : "/executionType",
                formatter : function(sValue) {
                    return sValue === sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.TRIGGERED;
                }
            },
            text : oTextBundle.getText("BU_LBL_AddTrigger"),
            tooltip : oTextBundle.getText("BU_TOL_AddTrigger"),
            press : [ function(oEvent) {
                this._publishPatternChanged({
                    luid : this.getModel().getProperty("/luid")
                });
                this._handleTriggerAppend(oEvent);
                // TODO
                this._publishWSChanged();
            }, this ]
        });

        oSimpleFormTrigger.addContent(oTriggersTable);
        oSimpleFormTrigger.addContent(oAddTriggerLink);

        oPropertyPane.insertContent(_oTriggerPanel, iProeprtyIndex++);

        // divider
        // oPropertyPane.insertContent(new sap.ui.commons.HorizontalDivider(),
        // iProeprtyIndex++);

        // default severity
        var oSimpleFormSeverity = new sap.ui.layout.form.SimpleForm({});
        var _oSeverityPanel = new sap.ui.commons.Panel({
            borderDesign : sap.ui.commons.enums.BorderDesign.Box,
            collapsed : false,
            content : oSimpleFormSeverity,
            title : new sap.ui.core.Title({
                text : oTextBundle.getText("ER_Severity"),
                level : sap.ui.core.TitleLevel.H6
            })
        });

        // mark it to avoid paddings
        _oSeverityPanel.addStyleClass("sapEtdNoPadding");

        oSimpleFormSeverity.addContent(new sap.ui.commons.DropdownBox({
            selectedKey : "{/severity}",
            items : {
                path : "enums>/sap.secmon.ui.browse/Pattern/Severity/enumValues",
                template : new sap.ui.core.ListItem({
                    key : "{enums>Key}",
                    text : "{enums>Value}"
                })
            },
            change : [ function(oEvent) {
                this._publishPatternChanged({
                    luid : oEvent.getSource().getModel().getProperty("/luid")
                });
            }, this ]
        }));

        oPropertyPane.insertContent(_oSeverityPanel, iProeprtyIndex++);

        // CIIA properties
        var oCIIALikelihood = {
            "likelihoodConfidentiality" : {
                "label" : "BU_LBL_PtnLC",
                "field" : "LikelihoodConfidentiality",
                "tooltip" : "BU_TOL_PtnLC"
            },
            "likelihoodIntegritySystem" : {
                "label" : "BU_LBL_PtnLIS",
                "field" : "LikelihoodIntegritySystem",
                "tooltip" : "BU_TOL_PtnLIS"
            },
            "likelihoodIntegrityData" : {
                "label" : "BU_LBL_PtnLID",
                "field" : "LikelihoodIntegrityData",
                "tooltip" : "BU_TOL_PtnLID"
            },
            "likelihoodAvailability" : {
                "label" : "BU_LBL_PtnLA",
                "field" : "LikelihoodAvailability",
                "tooltip" : "BU_TOL_PtnLA"
            }
        };

        var oSimpleFormLikelihood = new sap.ui.layout.form.SimpleForm({});
        var _oCIIALikelihoodPanel = new sap.ui.commons.Panel({
            borderDesign : sap.ui.commons.enums.BorderDesign.Box,
            collapsed : true,
            content : oSimpleFormLikelihood,
            title : new sap.ui.core.Title({
                text : oTextBundle.getText("BU_LBL_ThreatLikelihood"),
                level : sap.ui.core.TitleLevel.H6
            })
        });

        for (sKey in oCIIALikelihood) {
            oSimpleFormLikelihood.addContent(new sap.ui.commons.Label({
                text : oTextBundle.getText(oCIIALikelihood[sKey].label),
                tooltip : oTextBundle.getText(oCIIALikelihood[sKey].tooltip),
            }));
            oSimpleFormLikelihood.addContent(new sap.ui.commons.DropdownBox({
                selectedKey : "{/" + sKey + "}",
                items : {
                    path : "enums>/sap.secmon.ui.browse/Pattern/" + oCIIALikelihood[sKey].field + "/enumValues",
                    template : new sap.ui.core.ListItem({
                        key : "{enums>Key}",
                        text : "{enums>Value}"
                    })
                },
                change : [ function(oEvent) {
                    this._publishPatternChanged({
                        luid : oEvent.getSource().getModel().getProperty("/luid")
                    });
                }, this ]
            }));
        }
        oPropertyPane.insertContent(_oCIIALikelihoodPanel, iProeprtyIndex++);

        var oCIIASuccess = {
            "successConfidentiality" : {
                "label" : "BU_LBL_PtnSC",
                "field" : "SuccessConfidentiality",
                "tooltip" : "BU_TOL_PtnSC"
            },
            "successIntegritySystem" : {
                "label" : "BU_LBL_PtnSIS",
                "field" : "SuccessIntegritySystem",
                "tooltip" : "BU_TOL_PtnSIS"
            },
            "successIntegrityData" : {
                "label" : "BU_LBL_PtnSID",
                "field" : "SuccessIntegrityData",
                "tooltip" : "BU_TOL_PtnSID"
            },
            "successAvailability" : {
                "label" : "BU_LBL_PtnSA",
                "field" : "SuccessAvailability",
                "tooltip" : "BU_TOL_PtnSA"
            }
        };

        var oSimpleFormSuccess = new sap.ui.layout.form.SimpleForm({});
        var _oCIIASuccessPanel = new sap.ui.commons.Panel({
            borderDesign : sap.ui.commons.enums.BorderDesign.Box,
            collapsed : true,
            content : oSimpleFormSuccess,
            title : new sap.ui.core.Title({
                text : oTextBundle.getText("BU_LBL_ThreatSuccess"),
                level : sap.ui.core.TitleLevel.H6
            })
        });

        for (sKey in oCIIASuccess) {
            oSimpleFormSuccess.addContent(new sap.ui.commons.Label({
                text : oTextBundle.getText(oCIIASuccess[sKey].label),
                tooltip : oTextBundle.getText(oCIIASuccess[sKey].tooltip),
            }));
            oSimpleFormSuccess.addContent(new sap.ui.commons.DropdownBox({
                selectedKey : "{/" + sKey + "}",
                items : {
                    path : "enums>/sap.secmon.ui.browse/Pattern/" + oCIIASuccess[sKey].field + "/enumValues",
                    template : new sap.ui.core.ListItem({
                        key : "{enums>Key}",
                        text : "{enums>Value}"
                    })
                },
                change : [ function(oEvent) {
                    this._publishPatternChanged({
                        luid : oEvent.getSource().getModel().getProperty("/luid")
                    });
                }, this ]
            }));
        }
        oPropertyPane.insertContent(_oCIIASuccessPanel, iProeprtyIndex++);

        var oNavExemptionLink = new sap.m.Link({
            text : "{i18n>BU_LBL_NavExempltion}",
            visible : "{applicationContext>/userPrivileges/exemptionRead}",
            tooltip : "{i18n>BU_TOL_NavExempltion}",
            press : [ function(oEvent) {
                var sPatternId = this.getModel().getProperty("/artifactId");
                if (!sPatternId) {
                    this._showNotificationNoPatter();
                    return;
                }
                var sUrl = "/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad.html";
                sUrl += "?siteId=sap.secmon.ui.mobile.launchpad|ETDLaunchpad#Patterns-show?patternId=" + sPatternId + "&/pattern/" + sPatternId + "/exemptions";
                window.open(sUrl);
            }, this ]
        });
        oPropertyPane.insertContent(oNavExemptionLink, iProeprtyIndex++);
    },

    renderer : {},

    loadTriggersModel : function() {

        var that = this;
        var sTriggerType = this.getModel().getProperty("/triggerType");

        if (this.getModel().getProperty("/executionType") === sap.secmon.ui.browse.Constants.C_PATTERN_EXEC_TYPE.TRIGGERED) {
            var oAvailableTriggersModel = this.getModel("AvailableTriggersModel");
            var oMap = this._mapBackendService[sTriggerType];
            oMap.model.read(oMap.path, {
                success : function(oData, oResponse) {
                    if (oData.results) {
                        var aTriggers = [];
                        $.each(oData.results, function(idx, oResult) {
                            aTriggers.push({
                                key : sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oResult.Key),
                                text : oResult.Name
                            });
                        });
                        oAvailableTriggersModel.setProperty("/triggers", aTriggers);
                        oAvailableTriggersModel.refresh(true);

                        if (!that.getModel().getProperty("/triggers") || that.getModel().getProperty("/triggers").length === 0) {
                            that._handleTriggerAppend();
                        }
                    }
                },
                error : function(oError) {
                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
                }
            });
        }
    },

    _handleTriggerAppend : function() {

        var oAvailableTriggersModel = this.getModel("AvailableTriggersModel");
        var oSelectedField = oAvailableTriggersModel.getProperty("/triggers/0");

        var oFeed = this.getModel().getData();
        if (!oFeed.triggers) {
            oFeed.triggers = [];
        }
        oFeed.triggers.push({
            TriggerName : oSelectedField.key
        });

        this.getModel().refresh(true);
    },

    _handleTriggerDelete : function(oEvent) {

        var oFeed = this.getModel().getData();
        var sPath = oEvent.getSource().getParent().getParent().getParent().getParent().getBindingContext().getPath();
        var iIndex = parseInt(sPath.split("/triggers/")[1]);
        oFeed.triggers.splice(iIndex, 1);

        this.getModel().refresh(true);
    },

    _showNotificationNoPatter : function(){
        sap.m.MessageBox.show(oTextBundle.getText("BU_MSG_Nav_to_Exemption"), {
            icon: sap.m.MessageBox.Icon.WARNING,
            title : oTextBundle.getText("Fl_Warning")
        });
    }

});

sap.secmon.ui.browse.PatternDefinition.prototype.handleBeforeRendering = function() {
    if (this.getModel().getProperty("/threshold")) {
        // avoid the annoying rect due to multiple selection
        this._oCurrentChart.setInteraction(new sap.viz.ui5.types.controller.Interaction({
            selectability : new sap.viz.ui5.types.controller.Interaction_selectability({
                mode : sap.viz.ui5.types.controller.Interaction_selectability_mode.none
            })
        }));

        // deactivate chart types which don't fit to pattern
        var aButtons = this._oChartTypes.getButtons();
        aButtons[1].setVisible(false);
        aButtons[2].setVisible(false);
        aButtons[4].setVisible(false);
        aButtons[5].setVisible(false);
    }
},

/*
 * Drawing the threshold for Pattern
 */
sap.secmon.ui.browse.PatternDefinition.prototype.handleAfterRendering = function() {
    // draw the threshold
    var oChartModel = this.getModel();
    var iThreshold = oChartModel.getProperty("/threshold");
    if (iThreshold === undefined) {
        return;
    }

    // fetch the id for this Pattern
    // note that a page can contain multiple patterns/charts
    // we have to identify the pattern we refer to
    var sId = this._layout.getCenter().getContent()[0].getId();

    // root of chart
    var svg = d3.select("div#" + sId + " svg");
    if (svg === undefined) {
        return;
    }

    // get the domain size of the current chart
    var oPlot = svg.select(".v-m-background").select("rect");

    if (oPlot === undefined || oPlot[0][0] === null) {
        return;
    }

    var xMaxPixel = oPlot.attr("width");
    var yMaxPixel = oPlot.attr("height");

    var yMaxValue = svg.select(".v-m-yAxis").select(".v-label.viz-axis-label.v-morphable-label").select("text").node().innerHTML;

    // Threshold: calculate the pixel value
    var iThresholdPixel = yMaxPixel - iThreshold * yMaxPixel / yMaxValue;

    // remove the nodes if exist
    svg.selectAll(".v-m-plot g#_patternThreshold").data([]).exit().remove();

    var g = svg.select(".v-m-plot").append("g").attr("id", "_patternThreshold");    

    var d3Line = g.append("line").attr("stroke-width", 5).attr("stroke", "red");

    var d3Text = g.append("text").classed("sapEtdPatternThreshold", true).text(function(d) {
        return iThreshold;
    }).on("click", function(d) {
        // cover the text with an inputfield
        var result;
        result = prompt('Change the name of the node', iThreshold);
        if (result) {
            iThreshold = result;
            iThresholdPixel = yMaxPixel - iThreshold * yMaxPixel / yMaxValue;
            d3Text.text(function(d) {
                return iThreshold;
            }).attr("y", iThresholdPixel - 8);
            d3Line.attr("y1", iThresholdPixel).attr("y2", iThresholdPixel);
        }
    });

    // setup the drag behaviour
    var dragLine = d3.behavior.drag().on("dragstart", function() {
        d3.event.sourceEvent.stopPropagation();
        // console.log("Starting dragging");
    }).on("drag", function(d, i) {
        iThresholdPixel = d3.event.y;
        // check if the threshold is in range
        if (iThresholdPixel > 0 && iThresholdPixel <= yMaxPixel + 8) {
            // calculate the threshold and round off to only integer
            iThreshold = Math.round((yMaxPixel - iThresholdPixel) * yMaxValue / yMaxPixel);
            d3.select(this).attr("x1", 0).attr("y1", iThresholdPixel).attr("x2", xMaxPixel).attr("y2", iThresholdPixel);
            d3Text.attr("y", iThresholdPixel - 8).text(function(d) {
                return iThreshold;
            });
        }
    }).on("dragend", function() {
        oChartModel.setProperty("/threshold", iThreshold);
    });

    // prevent the click event
    d3Line.on("click", function() {
        if (d3.event.defaultPrevented) {
            return; // click suppressed
        }
    });

    var iDuration = this.getAnimationDuration();
    d3Text.transition().duration(iDuration).attr("x", 0).attr("y", iThresholdPixel - 8);
    d3Line.transition().duration(iDuration).attr("x1", 0).attr("y1", iThresholdPixel).attr("x2", xMaxPixel).attr("y2", iThresholdPixel);

    d3Line.call(dragLine);
};