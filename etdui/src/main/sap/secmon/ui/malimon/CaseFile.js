/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.malimon.CaseFile");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.m.commons.InvestigationCreator");
$.sap.require("sap.secmon.ui.m.commons.InvestigationAddendum");
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.declare("sap.secmon.ui.malimon.Constants");
sap.ui.core.Control.extend("sap.secmon.ui.malimon.CaseFile", {

    metadata : {
        properties : {
            width : {
                type : "sap.ui.core.CSSSize",
            },
            height : {
                type : "sap.ui.core.CSSSize",
            },
            component : {
                type : "object"
            }
        },

        aggregations : {
            _table : {
                type : "sap.m.Table",
                multiple : false
            }
        },

        events : {
            displayAttributes : {},
            detailsDeleted : {},
            tableUpdateFinished : {},
            displayPath : {
                parameters : {
                    aEvents : {}
                }
            }
        }

    },

    _oSaveCaseFileDialog : undefined,
    _oCommentsRPopover : undefined,
    _oCommentItemTemplate : undefined,

    init : function() {
        var that = this;
        // TODO: check which to use oInvestigationAddendumController or oInvestigationAddendum
        var oInvestigationCreatorController = sap.ui.controller("sap.secmon.ui.m.commons.InvestigationCreatorDialog");
        var oInvestigationAddendum = new sap.secmon.ui.m.commons.InvestigationAddendum();
        this._oCommentItemTemplate = new sap.m.FeedListItem({
            icon : "sap-icon://employee",
            sender : "{createdBy}",
            text : "{commentText}",
            timestamp : {
                path : "createdAt",
                formatter : function(dtVal) {
                    return sap.secmon.ui.commons.Formatter.dateFormatterEx(that.getComponent().getModel("applicationContext").getProperty("/UTC"), new Date(dtVal));
                }
            },
            info : "wrote",
            iconDensityAware : false,
            iconPress : function(oEvent) {
            },
            senderPress : function(oEvent) {
            }
        });

        var oFSpaceTable = new sap.m.Table({
            id : "sapEtdCaseFileTable",
            selectionChange : [ function(oEvent) {
                var oModel = this.getModel();
                var aSelected = [];
                var aSelectedItems = oEvent.getSource().getSelectedItems();
                aSelectedItems.forEach(function(oSelectedItem) {
                    aSelected.push({
                        detailId : oModel.getProperty(oSelectedItem.getBindingContextPath() + "/detailId"),
                        objectId : oModel.getProperty(oSelectedItem.getBindingContextPath() + "/objectId"),
                        objectType : oModel.getProperty(oSelectedItem.getBindingContextPath() + "/objectType"),
                        objectTimestamp : oModel.getProperty(oSelectedItem.getBindingContextPath() + "/objectTimestamp"),
                        description : oModel.getProperty(oSelectedItem.getBindingContextPath() + "/description")
                    });
                });
                this.getModel().setProperty("/selected", aSelected);
            }, this ],
            mode : "{path: 'applicationContext>/userPrivileges/casefileWrite', formatter: 'sap.secmon.ui.commons.Formatter.tableModeFormatter'}",
            updateFinished : [ function(oEvent) {
                this.fireTableUpdateFinished(oEvent);
            }, this ],
            fixedLayout : false,
            headerToolbar : new sap.m.Toolbar({
                content : [ new sap.m.Title({
                    text : {
                        path : "/name",
                        formatter : function(sName) {
                            return sName ? sName : oTextBundle.getText("MM_NewCFName");
                        }
                    }
                }), new sap.m.ToolbarSpacer(), new sap.m.Button({
                    icon : sap.ui.core.IconPool.getIconURI("save"),
                    tooltip : "{i18n>MM_SaveCF}",
                    visible : "{applicationContext>/userPrivileges/casefileWrite}",
                    press : [ function(oEvent) {
                        this._handleSaveCaseFile(oEvent);
                    }, this ]
                }), new sap.m.Button({
                    icon : sap.ui.core.IconPool.getIconURI("delete"),
                    tooltip : "{i18n>MM_DelCFDetails}",
                    enabled : {
                        path : "/selected/",
                        formatter : function(aVal) {
                            return aVal && aVal.length > 0;
                        }
                    },
                    visible : "{applicationContext>/userPrivileges/casefileWrite}",
                    press : [ function(oEvent) {
                        this._handleDeleteCaseFileDetails(oEvent);
                    }, this ]
                }), new sap.m.Button({
                    icon : sap.ui.core.IconPool.getIconURI("create"),
                    tooltip : "{i18n>MM_TIT_StartInv}",
                    visible : "{applicationContext>/userPrivileges/investigationWrite}",
                    press : [ function(oEvent) {
                        var sCaseFileId = this.getModel().getProperty("/caseFileId");
                        if (sCaseFileId && sCaseFileId !== "") {
                            oInvestigationCreatorController.openDialogEx([ {
                                ObjectType : 'FSPACE',
                                ObjectId : sCaseFileId
                            } ], this.getParent().getParent().getParent(), function() {
                                // console.log(this);
                                // alert("Success MM_TIT_StartInv" + "" + sCaseFileId);
                            }, function() {
                                return sap.secmon.ui.browse.utils.XCSRFToken ? sap.secmon.ui.browse.utils.XCSRFToken : sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
                            });
                        } else {
                            alert(oTextBundle.getText("MM_MSG_SaveCF"));
                        }
                    }, this ]
                }), new sap.m.Button({
                    icon : sap.ui.core.IconPool.getIconURI("add-product"),
                    tooltip : "{i18n>MM_TIT_Add2Inv}",
                    visible : "{applicationContext>/userPrivileges/investigationWrite}",
                    press : [ function(oEvent) {
                        var sCaseFileId = this.getModel().getProperty("/caseFileId");
                        if (sCaseFileId && sCaseFileId !== "") {
                            oInvestigationAddendum.showGeneralInvestigationAddendumDialog([ {
                                ObjectType : 'FSPACE',
                                ObjectId : sCaseFileId
                            } ], this.getParent().getParent().getParent(), function() {
                                // console.log(this);
                                // alert("Success MM_TIT_Add2Inv" + "" + sCaseFileId);
                            }, function() {
                                return sap.secmon.ui.browse.utils.XCSRFToken ? sap.secmon.ui.browse.utils.XCSRFToken : sap.secmon.ui.browse.utils.getXCSRFToken().getResponseHeader('X-CSRF-Token');
                            });
                        } else {
                            alert("Save the Case File first");
                        }
                    }, this ]
                }), new sap.m.Button({
                    icon : "sap-icon://line-chart",
                    tooltip : oTextBundle.getText("MM_TOL_AttackPath"),
                    visible : "{applicationContext>/userPrivileges/workspaceRead}",
                    enabled : {
                        path : "/details/",
                        formatter : function(aVal) {
                            for (var i = 0; i < aVal.length; i++) {
                                if (aVal[i].deleted) {
                                    return false;
                                }
                            }
                            return true;
                        }
                    },
                    press : [ function(oEvent) {
                        var oModel = this.getModel();
                        var oProperties = oModel.getProperty("/details");
                        var aEventList = [];
                        oProperties.forEach(function(oElement) {
                            if (oElement.objectType.toLowerCase() === sap.secmon.ui.malimon.Constants.C_TYPE.EVENT.toLowerCase()) {
                                aEventList.push(oElement);
                            }
                        });
                        this.fireEvent("displayPath", {
                            aEvents : aEventList
                        });
                    }, this ]
                }), new sap.m.Button({
                    icon : "sap-icon://comment",
                    tooltip : "{i18n>MM_TOL_Comments}",
                    text : {
                        path : "/comments",
                        formatter : function(aVal) {
                            return aVal ? aVal.length : 0;
                        }
                    },
                    press : [ function(oEvent) {
                        this._handleShowComments(oEvent);
                    }, this ]
                }), new sap.m.Button({
                    icon : "sap-icon://sys-help",
                    tooltip : "{i18nCommon>Help_BUT}",
                    press : function(oEvent) {
                        window.open("/sap/secmon/help/1ce16151fdf74bdb83f6e070a4a16089.html");
                    }
                }) ]
            }),
            columns : [ new sap.m.Column({
                header : new sap.m.Label({
                    text : "{i18n>MM_LBL_Timestamp}"
                })
            }), new sap.m.Column({
                header : new sap.m.Label({
                    text : "{i18n>MM_LBL_Comments}"
                }),
            }), new sap.m.Column({
                header : new sap.m.Label({
                    text : "{i18n>MM_LBL_Description}"
                })
            }) ],
            items : {
                path : "/details/",
                template : new sap.m.ColumnListItem({
                    cells : [ new sap.m.Label({
                        text : {
                            path : "objectTimestamp",
                            formatter : function(dtVal) {
                                return sap.secmon.ui.commons.Formatter.dateFormatterEx(that.getComponent().getModel("applicationContext").getProperty("/UTC"), new Date(dtVal));
                            }
                        }
                    }), new sap.m.Button({
                        icon : "sap-icon://comment",
                        tooltip : "{i18n>MM_TOL_Comments}",
                        text : {
                            path : "comments",
                            formatter : function(aVal) {
                                return aVal ? aVal.length : 0;
                            }
                        },
                        press : [ function(oEvent) {
                            this._handleShowComments(oEvent);
                        }, this ]
                    }), new sap.m.Link({
                        text : "{description}",
                        press : [ function(oEvent) {
                            this.fireDisplayAttributes(oEvent.getSource());
                        }, this ]
                    }) ]
                })
            },
        });
        this.setAggregation("_table", oFSpaceTable);
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.addStyle("width", oControl.getWidth());
        oRm.addStyle("height", oControl.getHeight());
        oRm.writeStyles();
        oRm.write(">");
        oRm.renderControl(oControl.getAggregation("_table"));
        oRm.write("</div>");
    },

    _handleDeleteCaseFileDetails : function(oEvent) {
        var that = this;
        var oModel = this.getModel();
        var aSelected = oModel.getProperty("/selected");

        sap.m.MessageBox.confirm(oTextBundle.getText("MM_DelCFDetailsConfirm"), function(oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                var aDetails = oModel.getProperty("/details");
                var aDetails2Del = oModel.getProperty("/details2del") || [];

                // this should also work but slower
                // aDetails2Del.concate(aSelected);

                // add selected entries for deletion to the model
                Array.prototype.push.apply(aDetails2Del, aSelected);

                // new details array contains only the undeleted entries
                var aDetailsNew = aDetails.filter(function(oDetail) {
                    return !aDetails2Del.some(function(oDetails2Del) {
                        return oDetails2Del.objectId === oDetail.objectId;
                    });

                });

                // update the model for the save operattion
                oModel.setProperty("/details2del", aDetails2Del);
                oModel.setProperty("/details", aDetailsNew);
                oModel.setProperty("/selected", []);
                var oJQTable = $("[id$=sapEtdCaseFileTable]");
                sap.ui.getCore().byId(oJQTable.attr('id')).removeSelections(true);

                that.fireDetailsDeleted();
            }
        }, oTextBundle.getText("MM_DelCFDetails"));
    },

    _handleSaveCaseFile : function(oEvent) {

        var C_CF_DML_PATH = "/sap/secmon/services/malimon/malimonDML.xsjs";
        var that = this;
        var oCaseFileModelData = this.getModel().getData();

        if (oCaseFileModelData.caseFileId === undefined || oCaseFileModelData.caseFileId === "") { // create
            if (!this._oSaveCaseFileDialog) {
                var oDummyController = {
                    pressedOK : function() {          
                        var sNewName = that._oSaveCaseFileDialog.getModel().getData().name;
                        var sNewNamespace = that._oSaveCaseFileDialog.getModel().getData().namespace;
                        if (sNewNamespace !== undefined && sNewNamespace !== "" && sNewName !== undefined && sNewName !== "") {
                            oCaseFileModelData.name = sNewName;
                            oCaseFileModelData.namespace = sNewNamespace;
                            fnSaveCaseFile("insert");
                        }                                
                    },
                    pressedCancel : function() {
                        that._oSaveCaseFileDialog.close();
                    }
                };
                this._oSaveCaseFileDialog = sap.ui.xmlfragment("sap.secmon.ui.malimon.SaveCaseFile", oDummyController);
                this.getParent().getParent().getParent().addDependent(this._oSaveCaseFileDialog);
            }
            var oCFSaveModel = new sap.ui.model.json.JSONModel();
            oCFSaveModel.setData({
                name : oCaseFileModelData.name,
                namespace : oCaseFileModelData.namespace,
            });
            this._oSaveCaseFileDialog.setModel(oCFSaveModel);
            this._oSaveCaseFileDialog.setModel(this.getModel("NamespacesModel"), "NamespacesModel");
            this._oSaveCaseFileDialog.open();
        } else {
            fnSaveCaseFile("update");
        }

        function fnSaveCaseFile(sMode) {
            if (that._oSaveCaseFileDialog && that._oSaveCaseFileDialog.isOpen()) {
                that._oSaveCaseFileDialog.setBusy(true);
            }
            switch (sMode) {
            case "insert":
                oCaseFileModelData.operation = "insert";
                break;
            case "update":
                oCaseFileModelData.operation = "update";
                break;
            }
            var promise = sap.secmon.ui.browse.utils.postJSon(C_CF_DML_PATH, JSON.stringify(oCaseFileModelData));
            promise.done(function(response, textStatus, XMLHttpRequest) {
                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, oTextBundle.getText("MM_MSG_CFSavedOK", oCaseFileModelData.name));
                if (that._oSaveCaseFileDialog && that._oSaveCaseFileDialog.isOpen()) {
                    that._oSaveCaseFileDialog.setBusy(false);
                    that._oSaveCaseFileDialog.close();
                }
                // convert timestamps to date object
                fnDBdateFields2Date(response);
                response.comments.forEach(function(oComment) {
                    fnDBdateFields2Date(oComment);
                });
                response.details.forEach(function(oDetail) {
                    fnDBdateFields2Date(oDetail);
                    oDetail.comments.forEach(function(oComment) {
                        fnDBdateFields2Date(oComment);
                    });
                });
                that.getModel().setData(response);
            });
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                if (that._oSaveCaseFileDialog) {
                    that._oSaveCaseFileDialog.setBusy(false);
                }
                if (errorThrown !== "abort") {
                    var sMessageText = oTextBundle.getText("MM_MSG_CFSaveFailed", oCaseFileModelData.name) + ": " + jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                    new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sMessageText);
                }
            });
        }

        function fnDBdateFields2Date(oObject) {
            var aTimeFieldNames = [ "createdAt", "changedAt", "objectTimestamp" ];
            aTimeFieldNames.forEach(function(sTimeFieldName) {
                if (oObject.hasOwnProperty(sTimeFieldName)) {
                    oObject[sTimeFieldName] = new Date(oObject[sTimeFieldName]);
                }
            });
        }
    },

    _handleShowComments : function(oEvent) {
        if (!this._oCommentsRPopover) {
            this._oCommentsRPopover = new sap.m.ResponsivePopover({
                placement : sap.m.PlacementType.Bottom,
                title : oTextBundle.getText("MM_TIT_Comments"),
                modal : false,
                resizable : true,
                content : [ new sap.m.FeedInput({
                    icon : "sap-icon://employee",
                    enabled : "{applicationContext>/userPrivileges/casefileWrite}",
                    post : [ function(oEvent) {
                        var aComments = this.getModel().getProperty(this._oCommentsRPopover.data().contextPath);
                        aComments.unshift({
                            createdBy : this.getComponent().getModel("applicationContext").getProperty("/userName"),
                            createdAt : new Date(),
                            commentText : oEvent.getParameter("value")
                        });
                        this.getModel().setProperty(this._oCommentsRPopover.data().contextPath, aComments);
                        this.getModel().refresh(true);
                    }, this ]
                }), new sap.m.List({
                    showSeparators : "Inner"
                }) ],
            });
            this._oCommentsRPopover.addStyleClass('sapUiSizeCompact');
            this._oCommentsRPopover.setModel(this.getModel());
        }
        if (this._oCommentsRPopover.isOpen()) {
            this._oCommentsRPopover.close();
        } else {
            var sContextPath =
                    (oEvent.getSource().mBindingInfos.text.binding.getContext() ? oEvent.getSource().mBindingInfos.text.binding.getContext().sPath + "/" : "") +
                            oEvent.getSource().mBindingInfos.text.binding.sPath;
            this._oCommentsRPopover.getContent()[1].bindAggregation("items", sContextPath, this._oCommentItemTemplate);
            this._oCommentsRPopover.data("contextPath", sContextPath);
            this._oCommentsRPopover.openBy(oEvent.getSource());
        }
    }
});