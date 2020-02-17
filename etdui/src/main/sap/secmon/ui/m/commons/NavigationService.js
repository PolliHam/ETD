jQuery.sap.declare("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.ushell.services.Container");
jQuery.sap.require("sap.secmon.ui.commons.RelatedEventsHelper");
jQuery.sap.require("sap.secmon.ui.commons.Privileges");

sap.secmon.ui.m.commons.NavigationService =
        {

            LAUNCHPAD_URL : "/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad.html?siteId=sap.secmon.ui.mobile.launchpad|ETDLaunchpad",
            ALLOWED_LANGUAGE : {
                en : "en",
                ru : "ru"
            },

            getLaunchpadUrl : function() {
                var language = sap.ui.getCore().getConfiguration().getLanguage();
                if (sap.secmon.ui.m.commons.NavigationService.ALLOWED_LANGUAGE.hasOwnProperty(language) === true) {
                    return sap.secmon.ui.m.commons.NavigationService.LAUNCHPAD_URL + sap.secmon.ui.m.commons.NavigationService.getLanguage();
                } else {
                    return sap.secmon.ui.m.commons.NavigationService.LAUNCHPAD_URL + sap.secmon.ui.m.commons.NavigationService.getLanguage();
                }
            },
            getLanguage : function() {
                var language = sap.ui.getCore().getConfiguration().getLanguage();
                if (sap.secmon.ui.m.commons.NavigationService.ALLOWED_LANGUAGE.hasOwnProperty(language) === true) {
                    return "&sap-language=" + language;
                } else {
                    return "&sap-language=en";
                }
            },

            getHexGuid : function(sGuid) {
                var validHex = /^[0-9A-F]{32}$/;
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                if (sGuid.length === 32 && validHex.test(sGuid) === true) {
                    return sGuid;
                } else {
                    return CommonFunctions.base64ToHex(sGuid);
                }
            },
            /**
             * get URL of an alert
             * 
             * @param alertGuid
             *            ID of alert, will be converted into HEX format
             */
            alertURL : function(alertGuid, tab) {
                var idHex = sap.secmon.ui.m.commons.NavigationService.getHexGuid(alertGuid);
                var url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#AlertDetails-show?alert=" + idHex;
                if (tab && tab.length > 0) {
                    url += "&tab=" + tab;
                }
                return url;
            },

            /**
             * get URL of a pattern. The URL navigates to either pattern UI or Anomaly Pattern UI
             * 
             * @param patternGuid
             *            ID of alert, will be converted into HEX format
             * @param bIsAnomalyPattern
             *            optional defaults to "false" String with boolean content
             */
            patternURL : function(patternGuid, bIsAnomalyPattern) {
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                var hexGuid = CommonFunctions.base64ToHex(patternGuid);
                var patternType = (bIsAnomalyPattern === "Yes" || bIsAnomalyPattern === "True") ? "ANOMALY" : "";

                return sap.secmon.ui.m.commons.NavigationService.patternURLWithHexGuid(hexGuid, patternType);
            },

            /**
             * get URL of a pattern
             * 
             * @param patternHexGuid
             *            ID of alert, ID is in HEX format
             * @param patternType
             *            String with content "ANOMALY" or something else
             */
            patternURLWithHexGuid : function(patternHexGuid, patternType) {
                if (patternType === "ANOMALY") {
                    return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#AnomalyDetectionPattern-show&/configurePattern/" + patternHexGuid;
                } else {
                    return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#Patterns-show?patternId=" + patternHexGuid;

                }
            },

            /**
             * @param eventHash
             *            optional ID of a semantic event
             */
            getURLOfKnowledgeBaseEvent : function(eventHash) {
                var url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#Knowledgebase-show&/events";
                if (eventHash) {
                    url += "/" + eventHash;
                }
                return url;
            },

            /**
             * @param eventHash
             *            optional ID of a log type
             */
            getURLOfKnowledgeBaseLogType : function(logTypeHash) {
                var url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#Knowledgebase-show&/logtypes";
                if (logTypeHash) {
                    url += "/" + logTypeHash;
                }
                return url;
            },

            /**
             * URL of open alerts of given pattern
             * 
             * @param patternId
             *            pattern GUID
             */
            openAlertsOfPatternURL : function(patternId) {
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                var hexGuid = CommonFunctions.base64ToHex(patternId);
                var sFilter = "&status=OPEN&orderBy=creationDate&orderDesc=true";
                return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#AlertsList-show&/?patternId=" + hexGuid + sFilter;
            },

            /**
             * URL of alerts of the last day of given pattern
             * 
             * @param patternId
             *            pattern GUID
             */
            lastDaysAlertsOfPatternURL : function(patternId) {
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                var hexGuid = CommonFunctions.base64ToHex(patternId);
                var sFilter = "&timeSelectionType=relative&timeLast=1&timeType=days&orderBy=creationDate&orderDesc=true";
                return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#AlertsList-show&/?patternId=" + hexGuid + sFilter;
            },

            /**
             * get URL of an valuelist
             * 
             * @param valuelistGuid
             *            ID of valuelist, will be converted into HEX format
             * @param bDetailsOnly
             *            if true, the value list details are displayed fullscreen, otherwise a mster/detail layout is shown with list of valuelists on the left, and the value list detail on the right
             */
            valuelistURL : function(valuelistGuid, bDetailsOnly) {
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                var hex = CommonFunctions.base64ToHex(valuelistGuid);
                if (bDetailsOnly === true) {
                    return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#Valuelist-show&/Detail/?Id=" + hex + "/Detail/Header(X'" + hex + "')/";
                } else {
                    return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#Valuelist-show&/valuelist/Header(X'" + hex + "')/";
                }
            },

            /**
             * get URL of an patternExecution
             * 
             * @param patternExecutionGuid
             *            ID of patternExecution, will be converted into HEX format
             */
            patternExecution : function(patternExecutionGuid) {
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#PatternExecutionResults-show&/executionResult/" + CommonFunctions.base64ToHex(patternExecutionGuid);
            },

            investigationsOfAlertURL : function(alertGuid) {
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                var hexGuid = CommonFunctions.base64ToHex(alertGuid);
                return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#AlertDetails-show?alert=" + hexGuid + "&tab=Investigations&/alert/Investigations/?alert=" + hexGuid;
            },

            investigationURL : function(investigationGuid, tab) {
                var sGuid = sap.secmon.ui.m.commons.NavigationService.getHexGuid(investigationGuid);
                var url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#InvestigationDetails-show?investigation=" + sGuid + "&/investigation/Investigation(X'" + sGuid + "')/";
                if (tab && tab.length > 0) {
                    url += "/" + tab;
                }
                return url;
            },

            /**
             * get URL of a file attachment at the investigation
             * 
             * @param fileGuid
             *            in binary format
             */
            investigationFileURL : function(fileGuid) {
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                var hexGuid = CommonFunctions.base64ToHex(fileGuid);
                return "/sap/secmon/services/ui/m/invest/InvestigationDocument.xsjs?Id=" + hexGuid;
            },

            /**
             * return URL of investigation template
             * 
             * @param investigationTemplateGuid
             *            guid in binary format. If not given, the list of investigation templates is shown
             * @param bEditMode
             *            if true, the template is is opened in edit mode, otherwise in display mode
             */
            investigationTemplateURL : function(investigationTemplateGuid, bEditMode) {
                if (!investigationTemplateGuid) {
                    return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#InvestigationTemplate-show";
                }
                var sGuid = sap.secmon.ui.m.commons.NavigationService.getHexGuid(investigationTemplateGuid);
                var mode = bEditMode === true ? "edit" : "display";
                return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#InvestigationTemplate-show&/" + mode + "/InvestigationTemplate(X'" + sGuid + "')";
            },

            /**
             * return URL to create investigation template
             * 
             * @param patternGuid
             *            optional guid in binary format.
             */
            createInvestigationTemplateURL : function(patternGuid) {
                var url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#InvestigationTemplate-show&/create";

                if (patternGuid) {
                    var sGuid = sap.secmon.ui.m.commons.NavigationService.getHexGuid(patternGuid);
                    url += '?pattern=' + sGuid;
                }
                return url;
            },

            /**
             * open system UI
             * 
             * @param systemName
             *            name of system
             * @param systemType
             *            type of system, e.g. ABAP
             * @param tab
             *            optional the tab to be opened
             */
            systemURL : function(systemName, systemType, tab) {
                var url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#System-show?system=" + encodeURIComponent(systemName) + "&type" + encodeURIComponent(systemType);
                if (tab && tab.length > 0) {
                    url += '&tab=' + tab;
                }
                return url;
            },

            eventTrendOfSystemURL : function(systemName, systemType) {
                return sap.secmon.ui.m.commons.NavigationService.systemURL(systemName, systemType, "eventTrend");
            },

            connectedSystemsOfSystemURL : function(systemName, systemType) {
                return sap.secmon.ui.m.commons.NavigationService.systemURL(systemName, systemType, "connectedSystems");
            },

            /**
             * param guid guid in base 64 format
             */
            casefileURL : function(guid) {
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                var hexGuid = CommonFunctions.base64ToHex(guid);
                return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#CaseFile-show&/CaseFile/" + hexGuid;
            },

            /**
             * return URL of snapshot
             * 
             * @param ID
             *            in hex format
             */
            snapshotURLWithHexGuid : function(sSnapshotId) {
                return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#Snapshot-show&/" + sSnapshotId;
            },

            /**
             * return URL of snapshot
             * 
             * @param ID
             *            in base64 format
             */
            snapshotURL : function(snapshotGuid) {
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                var hexGuid = CommonFunctions.base64ToHex(snapshotGuid);
                return sap.secmon.ui.m.commons.NavigationService.snapshotURLWithHexGuid(hexGuid);
            },

            /**
             * return URL of triggering events
             * 
             * @param alertGuid
             *            in base64 format
             * @param chartId
             *            optional if the chart ID is supplied then the alert is assumed to be an anomaly alert. In Base64 format.
             */
            triggeringEventsURL : function(alertGuid, chartId, triggeringEventCount) {
                var CommonFunctions = new sap.secmon.ui.commons.CommonFunctions();
                var hexGuid = CommonFunctions.base64ToHex(alertGuid);
                var sParameters = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#SemanticEvents-show&/?alert=" + hexGuid;
                if (triggeringEventCount && parseInt(triggeringEventCount, 10) > 0) {
                    sParameters += "&triggeringEventCount=" + triggeringEventCount;
                }
                if (chartId) {
                    var sChartId = CommonFunctions.base64ToHex(chartId);
                    sParameters += "&type=ANOMALY&chartId=" + sChartId;
                }
                return sParameters;
            },
            triggeringEventURLForDisplayForm : function(alertGuid, triggeringEventCount) {
                return sap.secmon.ui.m.commons.NavigationService.triggeringEventsURL(alertGuid, null, triggeringEventCount);
            },

            /**
             * @param sParameters
             *            a string of URL parameters. must be URL encoded. a value object of the form: {nameA : "valueA", nameB : ["valueB1","valueB2"] } Multiple values must be passed in as an array.
             *            Allowed parameter names are the column names of the log viewer. Examples: TerminalId, SystemId, UserPseudonym, SystemType, TCode, Report. Additionally, the time parameters
             *            timeFrom, timeTo may be supplied (in milliseconds since epoch)
             */
            eventsWithParamsURL : function(sParameters) {
                return sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#SemanticEventFS-show&/?" + sParameters;
            },

            /**
             * return URL of the log learning UI, with given run name and given log entry type GUID (in hex format)
             * 
             * @param sRunName
             *            name of run
             * @param optional
             *            sEntryTypeGUID GUID of log entry type in hex format
             */
            logLearningRunURL : function(sRunName, sEntryTypeGUID) {
                var url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#LogLearning-show&/";

                if (sRunName) {
                    url += encodeURIComponent(sRunName);

                    if (sEntryTypeGUID) {
                        url += "/entryType(" + sEntryTypeGUID + ")";
                    } else {
                        url += "/entryTypes";
                    }
                }

                return url;
            },

            /**
             * return URL of the productive rules UI, with given log entry type GUID (in hex format)
             * 
             * @param optional
             *            sEntryTypeGUID GUID of log entry type in binary format
             */
            productiveRuleURL : function(sEntryTypeGUID) {
                var url = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#ProductiveRules-show&/";
                if (sEntryTypeGUID) {
                    url += "Id=" + encodeURIComponent(sEntryTypeGUID);
                }
                return url;
            },

            /**
             * opens the browse-pattern with the specified id in a new window
             * 
             * @param sQueryDefinitionId
             *            pattern id
             * @param oQueryStartTimestamp
             * @param oQueryEndTimestamp
             *            Time interval inspected by the pattern query
             * 
             * oQueryStartTimestamp and oQueryEndTimestamp are optional. If supplied, both oQueryStartTimestamp and oQueryEndTimestamp must be supplied.
             */
            openBrowseUI : function(sQueryDefinitionId, oQueryStartTimestamp, oQueryEndTimestamp, windowObject) {
                windowObject = windowObject || window;
                var oCommons = new sap.secmon.ui.commons.CommonFunctions();
                var sUrl = "/sap/secmon/ui/browse/?Id=" + sQueryDefinitionId + sap.secmon.ui.m.commons.NavigationService.getLanguage();
                if (oQueryStartTimestamp && oQueryEndTimestamp) {
                    var sFrom = oCommons.formatDateToYyyymmddhhmmssUTC(oQueryStartTimestamp);
                    var sTo = oCommons.formatDateToYyyymmddhhmmssUTC(oQueryEndTimestamp);
                    sUrl = sUrl + "&from=" + sFrom + "&to=" + sTo;
                }
                windowObject.open(sUrl);
            },

            /**
             * opens the snapshot with the specified id in a new window
             * 
             * @param sSnapshotId
             *            ID of snapshot in hex format
             * @param windowObject
             *            the window in which the snapshot should be displayed
             */
            openSnapshotUI : function(sSnapshotId, windowObject) {
                windowObject = windowObject || window;
                var sUrl = sap.secmon.ui.m.commons.NavigationService.snapshotURLWithHexGuid(sSnapshotId);
                windowObject.open(sUrl);
            },

            /**
             * opens the logviewer in a new window. sAlertId contains alert id as hexadecimal stringopen
             * 
             * @param sAlertId
             *            alert id
             */
            openLogViewerForAlert : function(sAlertId, sAlertType, sChartId) {
                var sParameters = '?alert=' + sAlertId;
                if (sAlertType) {
                    sParameters += "&type=" + sAlertType;
                }
                if (sChartId) {
                    sParameters += "&chartId=" + sChartId;
                }
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : "#SemanticEvents-show&/" + sParameters
                    }
                });
            },
            /**
             * opens the logviewer (SemanticEventFS) with filter of the specified sAlertId
             * 
             * @param sAlertId
             *            alert id in hexadecimal format
             */
            openRelatedEventsOfAlertInLogViewer : function(sAlertId) {
                sap.secmon.ui.commons.RelatedEventsHelper.getRelatedEventCountAsDeferred(sAlertId).done(function(count, sFilter) {
                    sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                        target : {
                            shellHash : "#SemanticEventFS-show&/?" + sFilter
                        }
                    });
                }.bind(this));
            },

            /**
             * @param valuelistHexId
             *            ID of valuelist, must be in HEX format
             * @param bDetailsOnly
             *            if true, the value list details are displayed fullscreen, otherwise a mster/detail layout is shown with list of valuelists on the left, and the value list detail on the right
             */
            openValuelist : function(valuelistHexId, bDetailsOnly) {
                var authorized = this.getView().getModel("applicationContext").getProperty("/userPrivileges/" + sap.secmon.ui.commons.Privileges.VALUELIST_READ);
                if (authorized) {
                    var shellHash =
                            bDetailsOnly ? "#ValuelistDetails-show?Id=" + valuelistHexId + "&/Detail/Header(X'" + valuelistHexId + "')/" : "#Valuelist-show&/valuelist/Header(X'" + valuelistHexId +
                                    "')/";
                    sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                        target : {
                            shellHash : shellHash
                        }
                    });
                }
            },

            openAnomalyDetail : function(id) {
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        semanticObject : "AnomalyDetails",
                        action : "show"
                    },
                    params : {
                        Id : id
                    }
                });
            },

            /**
             * @param id
             *            the ID in hex format
             */
            openCaseFile : function(id) {
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : "#CaseFile-show&/CaseFile/" + id
                    }
                });
            },

            /**
             * @param investigationTemplateGuid
             *            the ID in binary format
             */
            openInvestigationTemplate : function(investigationTemplateGuid) {
                var hash;
                if (!investigationTemplateGuid) {
                    hash = "#InvestigationTemplate-show";
                } else {
                    var sGuid = sap.secmon.ui.m.commons.NavigationService.getHexGuid(investigationTemplateGuid);
                    hash = "#InvestigationTemplate-show&/display/InvestigationTemplate(X'" + sGuid + "')";
                }
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : hash
                    }
                });
            },

            /**
             * @param patternGuid
             *            optional a pattern ID in binary format
             */
            createInvestigationTemplate : function(patternGuid) {
                var hash = "#InvestigationTemplate-show&/create";
                if (patternGuid) {
                    var sGuid = sap.secmon.ui.m.commons.NavigationService.getHexGuid(patternGuid);
                    hash += '?pattern=' + sGuid;
                }
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : hash
                    }
                });
            },

            /**
             * Opens the logviewer in a new window.
             * 
             * @param oParams
             *            a value object of the form: {nameA : "valueA", nameB : ["valueB1","valueB2"] } Multiple values must be passed in as an array. Allowed parameter names are the column names of
             *            the log viewer. Examples: TerminalId, SystemId, UserPseudonym, SystemType, TCode, Report. Additionally, the time parameters timeFrom, timeTo may be supplied (in milliseconds
             *            since epoch)
             */
            openLogViewerWithParams : function(sParams, bOpenInNewWindow, windowObject) {
                windowObject = windowObject || window;
                if (bOpenInNewWindow) {
                    var sUrl = sap.secmon.ui.m.commons.NavigationService.eventsWithParamsURL(sParams);
                    windowObject.open(sUrl);
                } else {
                    sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                        target : {
                            shellHash : "#SemanticEventFS-show&/?" + sParams
                        }
                    });
                }
            },

            /**
             * navigate to anomaly pattern
             * 
             * @param sPatternId
             *            GUID in hex format
             */
            openAnomalyPattern : function(sPatternId) {
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : "#AnomalyDetectionPattern-show&/configurePattern/" + sPatternId
                    }
                });

            },

            /**
             * navigate to anomaly pattern
             * 
             * @param sPatternId
             *            GUID in hex format
             */
            openAnomalyEvaluation : function(sEvaluationId) {
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : "#AnomalyDetectionPattern-show&/configurePattern/evaluation/" + sEvaluationId
                    }
                });

            },

            /**
             * navigate to anomaly analysis
             * 
             * @param sPatternId
             *            GUID in hex format
             * @param oFromTimestamp
             *            optional Date object
             * @param oToTimestamp
             *            optional Date object
             */
            openAnomalyAnalysis : function(sPatternId, oFromTimestamp, oToTimestamp) {
                var hash = "#AnomalyDetectionPattern-show&";
                if (sPatternId) {
                    hash = hash + '/analysePattern/' + sPatternId;
                } else {
                    hash = hash + '/analysePattern';
                }
                if (oFromTimestamp && oToTimestamp) {
                    hash += "?fromTimestamp=" + oFromTimestamp.toISOString() + "&toTimestamp=" + oToTimestamp.toISOString();
                }
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : hash
                    }
                });

            },

            /*
             * open monitoring with alert as input. sAlertId contains alert id as hexadecimal string
             */
            openAlertInMonitoring : function(sAlertId, windowObject) {
                var sUrl = "/sap/secmon/ui/monitoring/?alertId=" + sAlertId + sap.secmon.ui.m.commons.NavigationService.getLanguage();
                windowObject = windowObject || window;
                windowObject.open(sUrl);
            },

            /**
             * navigate to pattern
             * 
             * @param sPatternId
             *            the pattern GUID
             * @param sPatternType
             *            the context of the pattern (Anomaly, or other)
             */
            navigateToPattern : function(sPatternId, sPatternType) {
                if (sPatternType !== "ANOMALY") {
                    sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                        target : {
                            semanticObject : "Patterns",
                            action : "show"
                        },
                        params : {
                            patternId : sPatternId
                        }
                    });
                } else {
                    sap.secmon.ui.m.commons.NavigationService.openAnomalyPattern(sPatternId);

                }
            },

            /**
             * navigate to investigation
             * 
             * @param sInvestigationId
             *            the investigation GUID in hex format
             */
            navigateToInvestigation : function(sInvestigationId) {
                var sId = sap.secmon.ui.m.commons.NavigationService.getHexGuid(sInvestigationId);
                if (sap.ushell.Container) {
                    sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                        target : {
                            semanticObject : "InvestigationDetails",
                            action : "show"
                        },
                        params : {
                            investigation : sId
                        }
                    });
                } else {
                    window.open(sap.secmon.ui.m.commons.NavigationService.investigationURL(sId));
                }
            },

            /**
             * navigate to alerts, filtered by pattern ID
             * 
             * @param sPatternId
             *            pattern GUID in hex format
             */
            navigateToAlertsOfPattern : function(sPatternId, sFilter) {
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : "#AlertsList-show&/?patternId=" + sPatternId + "&" + sFilter
                    }
                });
            },

            /**
             * Navigates to log learning and opens a specific run
             * 
             * @param name
             *            run name
             */
            openLogLearningRun : function(name) {
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : "#LogLearning-show&/" + encodeURIComponent(name) + "/entryTypes"
                    }
                });
            },

            openLogLearningEntryType : function(sRunName, sEntryTypeGUID) {
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : "#LogLearning-show&/" + encodeURIComponent(sRunName) + "/entryType(" + sEntryTypeGUID + ")"
                    }
                });
            },

            /**
             * navigate to a semantic event of knowledge base
             * 
             * @param eventHash
             *            the ID of a semantic event
             */
            openKBEvent : function(eventHash) {
                var hash = "Knowledgebase-show&/events";
                if (eventHash) {
                    hash += "/" + sap.secmon.ui.m.commons.NavigationService.getHexGuid(eventHash);
                }

                if (sap.ushell.Container) {
                    sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                        target : {
                            shellHash : hash
                        }
                    });
                } else {
                    window.open(sap.secmon.ui.m.commons.NavigationService.getURLOfKnowledgeBaseEvent(eventHash));
                }
            },

            /**
             * navigate to log type of knowledge base
             * 
             * @param eventHash
             *            the ID of a semantic event
             */
            openKBLogType : function(logTypeID) {
                var hash = "Knowledgebase-show&/logtypes";
                if (logTypeID) {
                    hash += "/" + sap.secmon.ui.m.commons.NavigationService.getHexGuid(logTypeID);
                }

                if (sap.ushell.Container) {
                    sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                        target : {
                            shellHash : hash
                        }
                    });
                } else {
                    window.open(sap.secmon.ui.m.commons.NavigationService.getURLOfKnowledgeBaseLogType(hash));
                }
            },

            /**
             * Navigates into the content replication UI
             * 
             * @param sTarget
             *            Import or Export
             */
            openContentReplication : function(sTarget, sContentPackageId) {
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : "#ContentReplication-show&/" + sTarget + "?contentPackageId=" + encodeURIComponent(sContentPackageId)
                    }
                });
            },

            openEventSeries : function(sFrom, sTo, sAlertList, sCaseFileId, sCustomQueryParameter) {
                var sUri = "#CaseFile-show&/EventSeries?";
                if (sFrom && sTo) {
                    sUri = sUri + "from=" + sFrom + "&to=" + sTo;
                }
                if (sCustomQueryParameter) {
                    sUri = sUri + "&" + sCustomQueryParameter;
                }
                if (sAlertList) {
                    sUri = sUri + "&alerts=" + sAlertList;
                }
                if (sCaseFileId) {
                    sUri = sUri + "&caseFileId=" + sCaseFileId;
                }
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : sUri
                    }
                });
            },

            openFieldsOfAttention : function(oQueryParams) {
                var sUri = "#FieldsOfAttention-show&/?";
                // ((from && to) || relativeTime) + focus + top + extraDims
                if (oQueryParams.hasOwnProperty("from") && oQueryParams.hasOwnProperty("to")) {
                    sUri = sUri + "from=" + oQueryParams.from + "&to=" + oQueryParams.to;
                } else if (oQueryParams.hasOwnProperty("relativeTime")) {
                    sUri = sUri + "relativeTime=" + oQueryParams.relativeTime;
                }
                if (oQueryParams.hasOwnProperty("focus")) {
                    sUri = sUri + "&focus=" + oQueryParams.focus;
                }
                if (oQueryParams.hasOwnProperty("top") && oQueryParams.top && parseInt(oQueryParams.top)) {
                    sUri = sUri + "&top=" + oQueryParams.top;
                }
                if (oQueryParams.hasOwnProperty("extraDims") && oQueryParams.extraDims.length) {
                    sUri = sUri + "&extraDims=" + oQueryParams.extraDims;
                }
                sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                    target : {
                        shellHash : sUri
                    }
                });
            },
        };
