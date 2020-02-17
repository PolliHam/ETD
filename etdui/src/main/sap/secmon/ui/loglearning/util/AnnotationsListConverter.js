jQuery.sap.require("sap.secmon.ui.loglearning.Constants");
jQuery.sap.require("sap.secmon.ui.browse.utils");
jQuery.sap.declare("sap.secmon.ui.loglearning.util.AnnotationsListConverter");

/**
 * The list of annotations of an entry type come in 2 variants: - the incomplete variant without annotations of type "BlankOrPunctuation". It requires the markup for thw whole picture. - the complete
 * variant with annotations of type "blankOrPunctuation". Its is self-contained. From it, markup and regex can be generated.
 */
sap.secmon.ui.loglearning.util.AnnotationsListConverter =
        {

            // These are the top annotation types visible in UI that can be newly created and inserted
            AVAILABLE_ANNOTATION_TYPES : sap.secmon.ui.loglearning.Constants.AVAILABLE_ANNOTATIONS,

            // These are the top annotation types visible in UI that are modifiable
            ANNOTATION_TYPES : sap.secmon.ui.loglearning.Constants.ANNOTATION_TYPES,

            /**
             * these complex annotations are not modifiable. But some of its child annotations are_: The pattern field can be edited.
             */
            COMPLEX_ANNOTATION_TYPES : {
                STRUCTURED_LIST : "StructuredList",
                KEYVALUE_LIST : "KeyValue.List",
                JSON : "JSON"
            },

            // These are the child annotations that are sort of hidden in the UI
            // (actually, in the annotations list the annotations "KeyValue.Key" and "StructuredPosition.Position" are displayed not by type but by field "FixedValue").
            CHILD_ANNOTATION_TYPES : {
                POSITION_TYPE : "StructuredPosition.Position",
                KEY_TYPE : "KeyValue.Key",
                STRUCTUREDPOSITION_TYPE : "StructuredPosition",
                KEYVALUE_TYPE : "KeyValue",
                KEYVALUE_VALUE_TYPE : "KeyValue.Value",
                POSITION_VALUE_TYPE : "StructuredPosition.Value"
            },

            ANNOTATION_ACTIONS : {
                CREATE : "CREATE",
                REMOVE : "REMOVE"
            },

            /**
             * Compare annotations: by entry type, by position, by parent-child relationship (parent annotations before child annotations). The annotations to be removed (these are logically deleted,
             * they won't show in UI) are added to the end
             */
            ANNOTATION_COMPARATOR : function(oAnnotation1, oAnnotation2) {
                var entryTypeDiff = (oAnnotation1["EntryTypeId.Id"] === oAnnotation2["EntryTypeId.Id"]) ? 0 : (oAnnotation1["EntryTypeId.Id"] < oAnnotation2["EntryTypeId.Id"]) ? -1 : 1;
                if (entryTypeDiff === 0) {
                    var iRemoved1 = oAnnotation1.Action === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.REMOVE ? 1 : 0;
                    var iRemoved2 = oAnnotation2.Action === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.REMOVE ? 1 : 0;
                    var removedDiff = iRemoved1 - iRemoved2;
                    if (removedDiff === 0) {
                        var posDiff = oAnnotation1.Position - oAnnotation2.Position;
                        if (posDiff === 0) {
                            // parent annotations before child annotations
                            return (oAnnotation1.ParentAnnotation ? 1 : -1) - (oAnnotation2.ParentAnnotation ? 1 : -1);
                        } else {
                            return posDiff;
                        }
                    } else {
                        return removedDiff;
                    }
                } else {
                    return entryTypeDiff;
                }

            },

            /**
             * Convenience function: The annotations of several entry types under one run are retrieved from DB in one array and sent to the UI in one array. This function allows to perform the
             * function "completeList" for the annotations of different entry types together.
             * 
             * @param aJoinedAnnotationsOfSeveralEntryTypes
             *            array of all annotations under one run
             * @param aMarkupsByEntryTypeIds
             *            an array of JS literals with fields "Id" and "Markup".
             * @return the joined/merged completed annotations of all entry types under one run (with added annotations of type "BlankOrPunctuation"). The returned annotations are sorted by
             *         EntryTypeId and Position.
             */
            completeAllAnnotationsOfRun : function(aJoinedAnnotationsOfSeveralEntryTypes, aMarkupsByEntryTypeIds) {
                // curried function
                function check(oMarkupByEntryTypeId) {
                    return function(annotation) {
                        return annotation["EntryTypeId.Id"] === oMarkupByEntryTypeId.Id;
                    };
                }

                var aReturnArray = [];
                var i = 0;
                for (i = 0; i < aMarkupsByEntryTypeIds.length; i++) {
                    var oMarkupByEntryTypeId = aMarkupsByEntryTypeIds[i];
                    var aFilteredAnnotations = aJoinedAnnotationsOfSeveralEntryTypes.filter(check(oMarkupByEntryTypeId));
                    var aCompletedAnnotations = sap.secmon.ui.loglearning.util.AnnotationsListConverter.completeList(aFilteredAnnotations, oMarkupByEntryTypeId.Markup);
                    aReturnArray = aReturnArray.concat(aCompletedAnnotations);
                }
                return aReturnArray;
            },

            /**
             * Complete the incomplete list with annotations of type "blankOrPunctuation" using the markup string. This is the reverse operation to "stripBlanksAndPunctuations". It also enhances an
             * annotation with additional field "DisplayName". Pre-condition: The list contains annotations of one entry type only
             * 
             * @param aIncompleteList
             *            the incomplete annotations list.
             * @param sMarkup
             *            the markup string
             * @return the completed list
             */
            completeList : function(aIncompleteList, sMarkup) {

                if (aIncompleteList.length === 0) {
                    return aIncompleteList;
                }
                var entryTypeId = aIncompleteList[0]["EntryTypeId.Id"];
                var runName = aIncompleteList[0].RunName;

                var currentPos = 0, nextPos = 0;
                var oNewAnnotation;
                var aCompletedList = [];
                var annotationText;
                var content;
                function createNewBlankOrPunctuationAnnotation(runName, entryTypeId, content) {
                    return {
                        Id : sap.secmon.ui.browse.utils.generateGUID(),
                        top : true,
                        Action : "",
                        FixedValue : content,
                        Type : sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.BLANK_OR_PUNCTUATION,
                        "EntryTypeId.Id" : entryTypeId,
                        RunName : runName,
                        AttrHash : null,
                        AttrHashList : "30",
                        IsCreatedManually : "false",
                        IsIdentifying : "false",
                        IsIdentifyingKeyPossible : "false",
                        ParentAnnotation : null,
                        Pattern : null,
                        RegexGroupName : ""
                    };
                }

                aIncompleteList.sort(sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_COMPARATOR).forEach(
                        function(oAnnotation) {
                            // Workaround for a feature (deficiency) of SAPUI5:
                            // A SAPUI5 filter cannot test if a value is null/undefined.
                            // Therefore, we need to supply default values.
                            // top: equivalent to "ParentAnnotation === null
                            // Action: only set when creating new annotation or removing existing one
                            // for top annotations only

                            if (!oAnnotation.Action) {
                                oAnnotation.Action = "";
                            }

                            if (!oAnnotation.ParentAnnotation) {
                                oAnnotation.top = true;

                                // add annotations of type "blankOrPunctuation" if necessary
                                annotationText =
                                        oAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.WORD ||
                                                oAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.BLANK_OR_PUNCTUATION ? oAnnotation.FixedValue : '<' +
                                                oAnnotation.Type + '>';
                                nextPos = sMarkup.indexOf(annotationText, currentPos);
                                if (nextPos !== currentPos) {
                                    content = sMarkup.slice(currentPos, nextPos);
                                    oNewAnnotation = createNewBlankOrPunctuationAnnotation(runName, entryTypeId, content);
                                    aCompletedList.push(oNewAnnotation);
                                    currentPos = nextPos;
                                }
                                currentPos += annotationText.length;
                            } else {
                                oAnnotation.top = false;
                            }

                            aCompletedList.push(oAnnotation);
                        });
                if (currentPos !== sMarkup.length) {
                    content = sMarkup.slice(currentPos, sMarkup.length);
                    oNewAnnotation = createNewBlankOrPunctuationAnnotation(runName, entryTypeId, content);
                    aCompletedList.push(oNewAnnotation);
                }

                // re-set index
                return sap.secmon.ui.loglearning.util.AnnotationsListConverter._recalculatePositions(aCompletedList);
            },

            /**
             * Remove the annotations of type "blankOrPunctuation" from the list. This is the reverse operation to "completeList".
             * 
             * @param aCompleteList
             *            the complete list, complete with annotations of type "blankOrPunctuation". The list may contain annotations of several entry types.
             * @return a incomplete list.
             */
            stripBlanksAndPunctuations : function(aCompleteList) {
                // strip
                var aIncompleteList = aCompleteList.filter(function(oAnnotation) {
                    return oAnnotation.Type !== sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.BLANK_OR_PUNCTUATION;
                }).sort(sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_COMPARATOR);

                // remove additional fields, they might cause problems when persisting
                aIncompleteList.forEach(function(oAnnotation) {
                    delete oAnnotation.DisplayName;
                    delete oAnnotation.top;
                });

                // re-set index
                return sap.secmon.ui.loglearning.util.AnnotationsListConverter._recalculatePositions(aIncompleteList);
            },

            /**
             * build markup string from complete annotations list. Example: "&t;<Integer>&gt; CONSTANT1 CONSTANT2:<KeyValue.List> <Var><Var>". This function can be used as a formatter function.
             * Pre-conditions: The list contains annotations of only one entry type. It is sorted according to position.
             * 
             * @param aCompleteList
             *            complete annotations list, complete with annotations of type "blankOrPunctuation".
             * @return markup string
             */
            buildMarkup : function(aCompleteList) {
                return aCompleteList.filter(function(oAnnotation) {
                    // only top annotations. Annotations to be removed must be ignored
                    return !oAnnotation.ParentAnnotation && oAnnotation.Action !== sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.REMOVE;
                }).reduce(
                        function(sMarkup, oAnnotation) {
                            if (oAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.WORD ||
                                    oAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.BLANK_OR_PUNCTUATION) {
                                return sMarkup + oAnnotation.FixedValue;
                            } else {
                                return sMarkup + '<' + oAnnotation.Type + '>';
                            }
                        }, "");
            },

            /**
             * build beautified markup string from complete annotations list. The annotations are numbered. Example: "&t;<Integer1>&gt; CONSTANT1 CONSTANT2:<KeyValue.List1> <Var1><Var2>". The
             * function can be used as formatter function. Pre-conditions: The list contains annotations of only one entry type. It is sorted according to position.
             * 
             * @param aCompleteList
             *            complete annotations list, complete with annotations of type "blankOrPunctuation". The list contains annotations of one entry type only.
             * @return markup string
             */
            buildBeautifiedMarkup : function(aCompleteList) {
                return aCompleteList.filter(function(oAnnotation) {
                    // only top annotations. Annotations to be removed must be ignored
                    return !oAnnotation.ParentAnnotation && oAnnotation.Action !== sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.REMOVE;
                }).reduce(function(sMarkup, oAnnotation) {
                    return sMarkup + oAnnotation.DisplayName;
                }, "");
            },

            /**
             * Convenience function: Do a logical remove of the annotation with given position from list. The "removed" annotation is still contained in the list but invisible. The positions of other
             * annotations are recalculated. The list may contain annotations from several entry types.
             * 
             * @param aCompleteList
             *            the complete list of annotations of one entry type.
             * @param oSelectedAnnotation
             *            the annotation to be removed
             * @return the filtered annotations list.
             */
            removeAnnotation : function(aCompleteList, oSelectedAnnotation) {
                // Pre-condition: only top annotations can be modified and deleted
                if (oSelectedAnnotation.ParentAnnotation) {
                    throw "Programming Error: Contact the ETD Development Team. A sub-annotation may not be deleted";
                }

                // If the annotation has been created recently we can simply remove it
                var aReturnList;
                if (oSelectedAnnotation.Action === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.CREATE) {
                    aReturnList = aCompleteList.filter(function(oAnnotation) {
                        return oAnnotation.Id !== oSelectedAnnotation.Id;
                    });
                } else {
                    oSelectedAnnotation.Action = sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.REMOVE;
                    aReturnList = aCompleteList;
                }
                return sap.secmon.ui.loglearning.util.AnnotationsListConverter.mergeAndAdaptPositions(aReturnList);
            },

            /**
             * Insert a new annotation as top annotation in the sorted list. Pre-Condition: The list must be sorted according to entry type and position.
             * 
             * @param aSortedList
             *            the sorted list
             * @param oNewAnnotation
             *            the new annotation. Its position will be calculated. Its field "EntryTypeId.Id" must be set. It will be displayed as a top annotation.
             * @param oReferenceAnnotation
             *            existing annotation. The new annotation is inserted before or after the existing annotation. If none is found, the new annotation is appended to the list
             * @param bAfter
             *            if true, the new annotation is inserted after the
             * @return the modified list. The list is sorted.
             */
            insertAnnotation : function(aSortedList, oNewAnnotation, oReferenceAnnotation, bAfter) {

                // pre-condition
                if (!sap.secmon.ui.loglearning.util.AnnotationsListConverter.AVAILABLE_ANNOTATION_TYPES.some(function(oAvailableAnnotation) {
                    return oAvailableAnnotation.key === oNewAnnotation.Type;
                })) {
                    throw "Programming error: Contact the ETD Development team. The new annotation does not have a type.";
                }

                oNewAnnotation["EntryTypeId.Id"] = oReferenceAnnotation["EntryTypeId.Id"];
                oNewAnnotation.top = true;
                oNewAnnotation.Action = sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.CREATE;

                var index = 0;
                var foundIndex = -1;
                // find array index (needed for splice) of the reference annotations.
                aSortedList.forEach(function(oAnnotation) {
                    if (oAnnotation.Id === oReferenceAnnotation.Id) {
                        foundIndex = index;
                        return;
                    }
                    index++;
                });

                if (foundIndex === -1) {
                    throw "Programming Error: Contact the ETD Development Team. The new annotation cannot be inserted.";
                } else {
                    if (bAfter) {
                        var afterIndex;
                        // The list is sorted:
                        // For a complex annotation (JSON, KeyValue.List, or StructuredList), the top annotation is followed by its sub-annotations.
                        // I.e.: Continue until the first top annotation is found
                        for (index = foundIndex + 1; index < aSortedList.length; index++) {
                            if (!aSortedList[index].ParentAnnotation) {
                                afterIndex = index;
                                break;
                            }
                        }
                        foundIndex = (afterIndex) ? afterIndex : aSortedList.length + 1;
                    }
                    aSortedList.splice(foundIndex, 0, oNewAnnotation);
                }

                return sap.secmon.ui.loglearning.util.AnnotationsListConverter.mergeAndAdaptPositions(aSortedList);
            },

            /**
             * after the list has been updated (an annotation was updated, inserted, or removed), the list should be checked if adjacent annotations can be merged. Then positions need to be
             * recalculated.
             * 
             * @param aSortedList
             *            sorted list of annotations
             * @return the merged list with recalculated positions.
             */
            mergeAndAdaptPositions : function(aSortedList) {
                // merge adjacent Word and BlankOrPunctuation annotations
                var aMergedList = sap.secmon.ui.loglearning.util.AnnotationsListConverter._mergeAdjacentAnnotations(aSortedList);
                // re-set position
                return sap.secmon.ui.loglearning.util.AnnotationsListConverter._recalculatePositions(aMergedList);
            },

            /**
             * merge annotations of the same type (only for BlankOrPunctuation or Word types) Pre-Condition: The list is sorted according to entry type and position.
             * 
             * @param aSortedList
             *            list including BlankOrPunctuation type.
             * @return the merged list, the list does not have its positions re-calculated. There might be gaps.
             */
            _mergeAdjacentAnnotations : function(aSortedList) {
                var aMergedList = [];
                var index = 0;
                var oLastAnnotation;
                for (index = 0; index < aSortedList.length; index++) {
                    var oAnnotation = aSortedList[index];

                    if (oAnnotation.Action === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.REMOVE || oAnnotation.ParentAnnotation) {
                        aMergedList.push(oAnnotation);
                        continue;
                    }
                    // Filter for top annotations only: Sometimes, there is a "Timestamp" annotation as a sub-annotation. it serves as a placeholder for the timestamp pattern.
                    var bAllowedType =
                            oLastAnnotation &&
                                    (oLastAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.WORD ||
                                     oLastAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.BLANK_OR_PUNCTUATION);
                    var bIsTop = oLastAnnotation && !oLastAnnotation.ParentAnnotation && !oAnnotation.ParentAnnotation;
                    var bSubsequentTypes = oLastAnnotation && oLastAnnotation.Type === oAnnotation.Type && oLastAnnotation["EntryTypeId.Id"] === oAnnotation["EntryTypeId.Id"];
                    var bMergePossible = bAllowedType === true && bIsTop === true && bSubsequentTypes === true;
                    if (bMergePossible) {
                        oLastAnnotation.FixedValue += oAnnotation.FixedValue;
                        if (oAnnotation.Action !== sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.CREATE) {
                            oAnnotation.Action = sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.REMOVE;
                            aMergedList.push(oAnnotation);
                        }// else: do not keep it
                    } else {
                        oLastAnnotation = oAnnotation;
                        aMergedList.push(oAnnotation);
                    }
                }
                return aMergedList;
            },

            /**
             * Re-calculates the field "Position" on a sorted list of annotations. This function should be called after the list has been modified (insertion, deletion of an annotation). The sorted
             * list keeps its order. Side-effect: It also adds a new field "DisplayName" to the annotation. The field "DisplayName" contains a number which needs to be re-calculated after the list has
             * been modified.
             * 
             * @param aSortedList
             *            sorted list of annotations. It works on both completed lists with "blankOrPunctuation" annotations, or on incomplete lists without. The list is assumed to be sorted: Parent
             *            annotations are listed before child annotations. The list may contain annotations of several entry types.
             */
            _recalculatePositions : function(aSortedList) {
                function nameChildAnnotation(oChildAnnotation, variableName) {
                    // We assume that a child inherits its position from its parent.
                    // If the position is -1 then its a lost child, we don't know its parent.

                    // It is possible in 2 cases that we have annotations other than "Key.Value.Key" and "KeyValue.Value" under a parent annotation "KeyValue",
                    // and analogously, it is possible to have annotations other than "StructuredPosition.Position" and "StructuredPosition.Value" under
                    // parent annotation "StructuredPosition".
                    // - Special case if a specific type (e.g. timestamp with a timestamp format) is discovered within a key-value list or list,
                    // then an additional child of the specific type is added.
                    // - Special case for KeyValue Lists: If key and value are separated by '=', '->', or '<-', then an additional child of
                    // type "Symbolic" is added.
                    var tmpDisplayName = oChildAnnotation.Position === -1 ? "?" : "<" + variableName + ">";
                    var tmpVariableName = oChildAnnotation.Position === -1 ? "?" : variableName;
                    var tmpTxt;
                    switch (oChildAnnotation.Type) {
                    case sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.STRUCTUREDPOSITION_TYPE:
                        tmpTxt = "List-Element";
                        break;
                    case sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.KEYVALUE_TYPE:
                        tmpTxt = "List-Element";
                        break;
                    case sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.POSITION_TYPE:
                        tmpTxt = "Position";
                        break;
                    case sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.KEY_TYPE:
                        tmpTxt = "Key";
                        break;
                    case sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.KEYVALUE_VALUE_TYPE:
                        tmpTxt = "Value";
                        break;
                    case sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.POSITION_VALUE_TYPE:
                        tmpTxt = "Value";
                        break;
                    case sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.SYMBOL_TYPE:
                        tmpTxt = "Separator Symbol";
                        break;
                    default:
                        tmpTxt = "Type with Pattern";
                        break;

                    }
                    // leaf annotations KeyValue.Key or StructuredPosition.Position
                    if (oChildAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.POSITION_TYPE ||
                            oChildAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.KEY_TYPE) {
                        oChildAnnotation.DisplayName = tmpDisplayName + "[" + oChildAnnotation.FixedValue + "]";
                        oChildAnnotation.VariableName = tmpVariableName + "[" + oChildAnnotation.FixedValue + "]";
                        oChildAnnotation.LegacyVariableName = tmpTxt + ":" + oChildAnnotation.FixedValue + " (" + tmpVariableName + ")";
                        // the generation in-the-middle: KeyValue and StructuredPosition
                    } else if (oChildAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.STRUCTUREDPOSITION_TYPE ||
                            oChildAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.KEYVALUE_TYPE) {
                        oChildAnnotation.DisplayName = tmpDisplayName + "[" + tmpTxt + "]";
                        oChildAnnotation.VariableName = tmpVariableName + "[" + tmpTxt + "]";
                        oChildAnnotation.LegacyVariableName = tmpTxt + " (" + tmpVariableName + ")";

                    } else {
                        // Usually, this is a Timestamp annotation
                        if (oChildAnnotation.Pattern) {
                            oChildAnnotation.DisplayName = tmpDisplayName + "[<" + oChildAnnotation.Type + ">]-Pattern:" + oChildAnnotation.Pattern;
                            oChildAnnotation.VariableName = tmpVariableName + "[<" + oChildAnnotation.Type + ">]-Pattern:" + oChildAnnotation.Pattern;
                            oChildAnnotation.LegacyVariableName = tmpTxt + ":" + oChildAnnotation.Type + " (" + tmpVariableName + ")";
                        } else { // this is the Symbolic annotation
                            oChildAnnotation.DisplayName = tmpDisplayName + "[<" + oChildAnnotation.Type + ">]";
                            oChildAnnotation.VariableName = tmpVariableName + "[<" + oChildAnnotation.Type + ">]";
                            oChildAnnotation.LegacyVariableName = tmpTxt + " (" + tmpVariableName + ")";
                        }

                    }
                }

                var counter = {
                    getCount : function(key) {
                        if (!this[key]) {
                            this[key] = 1;
                        }
                        var count = this[key];
                        this[key]++;
                        return count;
                    },
                    reset : function() {
                        for ( var prop in this) {
                            if (prop === 'getCount' || prop === 'reset') {
                                continue;
                            }
                            this[prop] = 1;
                        }
                    }

                };
                var index = 0;
                // displayName: name of annotation (or component thereof), enclosed in < and >.
                // variableName: name of variable with content (if a RegEx is used to extract values from variables, the variable name corresponds to regex group name)
                // legacyVariableName: in value mapping, operator "Merge", the script interpreter expects variable names of the form "Key:" or "Position:"
                var variableName;
                var currentEntryTypeId = aSortedList[0];
                // the algorithm only works if the list is sorted by entryType Id, Position, and parent before children
                aSortedList.forEach(function(oAnnotation) {

                    if (oAnnotation.Action === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.REMOVE) {
                        return false;
                    }

                    if (currentEntryTypeId !== oAnnotation["EntryTypeId.Id"]) {
                        counter.reset();
                        index = 0;
                        currentEntryTypeId = oAnnotation["EntryTypeId.Id"];
                    }

                    // only top annotations have increasing positions, child annotations inherit the position from their parent.
                    if (!oAnnotation.ParentAnnotation) {
                        index++;
                    }
                    oAnnotation.Position = index;

                    // add a telling DisplayName for annotations
                    if (!oAnnotation.ParentAnnotation) {
                        // top annotations
                        if (oAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.WORD ||
                                oAnnotation.Type === sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.BLANK_OR_PUNCTUATION) {
                            oAnnotation.DisplayName = oAnnotation.FixedValue;
                            oAnnotation.VariableName = oAnnotation.FixedValue;
                            oAnnotation.LegacyVariableName = oAnnotation.LegacyFixedValue;
                        } else {
                            variableName = oAnnotation.Type + counter.getCount(oAnnotation.Type);
                            oAnnotation.VariableName = variableName;
                            oAnnotation.LegacyVariableName = variableName;
                            oAnnotation.DisplayName = "<" + variableName + ">";
                        }
                    } else {
                        nameChildAnnotation(oAnnotation, variableName);
                    }

                });
                return aSortedList;
            },

            /**
             * return filter which - filters annotations by entry type ID - gets all primitive top annotations (Integer, host, ...) but leaves out BlankAndPunctuation - leaves out complex types
             * (StructuredList, KeyValue.List, and JSON), - gets the leaf annotations KeyValue.Key and StructuredPosition.Position - leaves out logically deleted annotations (with flag Action =
             * 'REMOVE')
             * 
             * @return sap.ui.model.Filter
             */
            createFilterOfLeafAnnotations : function(sEntryTypeId) {
                var aMandatoryFilters = [ new sap.ui.model.Filter({
                    path : "Type",
                    operator : sap.ui.model.FilterOperator.NE,
                    value1 : sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.BLANK_OR_PUNCTUATION
                }), new sap.ui.model.Filter({
                    path : "Type",
                    operator : sap.ui.model.FilterOperator.NE,
                    value1 : sap.secmon.ui.loglearning.util.AnnotationsListConverter.COMPLEX_ANNOTATION_TYPES.JSON
                }), new sap.ui.model.Filter({
                    path : "Type",
                    operator : sap.ui.model.FilterOperator.NE,
                    value1 : sap.secmon.ui.loglearning.util.AnnotationsListConverter.COMPLEX_ANNOTATION_TYPES.KEYVALUE_LIST
                }), new sap.ui.model.Filter({
                    path : "Type",
                    operator : sap.ui.model.FilterOperator.NE,
                    value1 : sap.secmon.ui.loglearning.util.AnnotationsListConverter.COMPLEX_ANNOTATION_TYPES.STRUCTURED_LIST
                }), new sap.ui.model.Filter({
                    path : "EntryTypeId.Id",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : sEntryTypeId
                }), new sap.ui.model.Filter({
                    path : "Action",
                    operator : sap.ui.model.FilterOperator.NE,
                    value1 : sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.REMOVE
                }) ];

                var oMandatoryFilter = new sap.ui.model.Filter({
                    and : true,
                    filters : aMandatoryFilters
                });

                // if the annotation is a top annotations, display any primitive type but not a Word annotation
                var oTopFilter = new sap.ui.model.Filter({
                    and : true,
                    filters : [ new sap.ui.model.Filter({
                        path : "top",
                        operator : sap.ui.model.FilterOperator.EQ,
                        value1 : true
                    }), new sap.ui.model.Filter({
                        path : "Type",
                        operator : sap.ui.model.FilterOperator.NE,
                        value1 : sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_TYPES.WORD
                    }) ]
                });

                // Sub-annotations of KeyValue.List or JSON:
                // Display KeyValue.Key annotations, these contain the path
                var oKeyFilter = new sap.ui.model.Filter({
                    and : true,
                    filters : [ new sap.ui.model.Filter({
                        path : "Type",
                        operator : sap.ui.model.FilterOperator.EQ,
                        value1 : sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.KEY_TYPE
                    }), new sap.ui.model.Filter({
                        path : "top",
                        operator : sap.ui.model.FilterOperator.EQ,
                        value1 : false
                    }) ]
                });

                // Sub-annotations of StructuredList:
                // Display the StructuredPosition.Position, these contain the index
                var oPositionFilter = new sap.ui.model.Filter({
                    and : true,
                    filters : [ new sap.ui.model.Filter({
                        path : "Type",
                        operator : sap.ui.model.FilterOperator.EQ,
                        value1 : sap.secmon.ui.loglearning.util.AnnotationsListConverter.CHILD_ANNOTATION_TYPES.POSITION_TYPE
                    }), new sap.ui.model.Filter({
                        path : "top",
                        operator : sap.ui.model.FilterOperator.EQ,
                        value1 : false
                    }) ]
                });

                var oOredFilter = new sap.ui.model.Filter({
                    and : false,
                    filters : [ oTopFilter, oKeyFilter, oPositionFilter ]
                });

                return new sap.ui.model.Filter({
                    and : true,
                    filters : [ oMandatoryFilter, oOredFilter ]
                });

            },

            /**
             * return filter which - filters annotations by entry type ID - gets all annotation types except sub annotations (like annotations KeyValue.Key and StructuredPosition.Position) - leaves
             * out logically deleted annotations (with flag Action = 'REMOVE')
             * 
             * @return sap.ui.model.Filter
             */
            createFilterOfTopAnnotations : function(sEntryTypeId) {

                return new sap.ui.model.Filter({
                    and : true,
                    filters : [ new sap.ui.model.Filter({
                        path : "EntryTypeId.Id",
                        operator : sap.ui.model.FilterOperator.EQ,
                        value1 : sEntryTypeId
                    }), new sap.ui.model.Filter({
                        path : "top",
                        operator : sap.ui.model.FilterOperator.EQ,
                        value1 : true
                    }), new sap.ui.model.Filter({
                        path : "Action",
                        operator : sap.ui.model.FilterOperator.NE,
                        value1 : sap.secmon.ui.loglearning.util.AnnotationsListConverter.ANNOTATION_ACTIONS.REMOVE
                    }) ]
                });

            }

        };
