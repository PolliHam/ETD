jQuery.sap.declare("sap.secmon.ui.loglearning.util.Checks");

/**
 * Make some checks globally available.
 */
sap.secmon.ui.loglearning.util.Checks = {

    /**
     * Find those event attributes which have been assigned more than one value (from annotations, constant values, and value mappings).
     * 
     * @param oRunData
     *            the data as stored in model "RunJSONModel"
     * @param entryTypeId
     *            optional if given, do a check for assignments of the given entry type. Otherwise, do the check for all entry types of run.
     * @return a map of the form entryTypeId: array of duplicate attribute names
     */
    findNamesOfDuplicateAttributes : function(oRunData, entryTypeId) {

        var i, j;
        var count = 0;
        var sEntryTypeId;
        var oEntryType;
        var oAttributes;
        var aAttributes;
        var sAttribute;

        // map of entryTypeId: (map of attrHash: attribute count)
        var oEntryTypeAttributesMap = {};

        if (entryTypeId) {
            oEntryTypeAttributesMap[entryTypeId] = {};
        } else {
            // get all entry type Ids
            for (i = 0; i < Object.keys(oRunData.entryTypes.header).length; i++) {
                oEntryType = oRunData.entryTypes.header[i];
                sEntryTypeId = oEntryType.Id;
                if (!oEntryTypeAttributesMap[sEntryTypeId]) {
                    oEntryTypeAttributesMap[sEntryTypeId] = {};
                }
            }
        }

        // visitor function to accumulate the count of an attribute
        // @param oEntity the object which might be assigned to an event attribute (e.g. annotation, constnatValue, valueMappingTarget)
        function collectAttributeCount(oEntity, sEntryTypeId) {
            if (oEntity.attrHash === "30") {
                return;
            }
            oAttributes = oEntryTypeAttributesMap[sEntryTypeId];
            function increaseCount(targetAttribute) {
                if (targetAttribute.hashHex === '30') {
                    // null hash
                    return;
                }
                sAttribute = targetAttribute.displayName;
                count = oAttributes[sAttribute];
                if (count) {
                    oEntryTypeAttributesMap[sEntryTypeId][sAttribute]++;
                } else {
                    oEntryTypeAttributesMap[sEntryTypeId][sAttribute] = 1;
                }
            }

            if (oEntity.TargetAttributeIds) {
                oEntity.TargetAttributeIds.forEach(increaseCount);

            } else if (oEntity.TargetAttributeId) {
                increaseCount(oEntity.TargetAttributeId);
            }
        }

        // go through annotations, and retrieve attribute Ids sorted by entry type
        for (i = 0; i < Object.keys(oRunData.entryTypes.allAnnotations).length; i++) {
            var annotation = oRunData.entryTypes.allAnnotations[i];
            sEntryTypeId = annotation["EntryTypeId.Id"];
            if (entryTypeId && sEntryTypeId !== entryTypeId) {
                continue;
            }
            collectAttributeCount(annotation, sEntryTypeId);
        }

        // go through constant values, and retrieve attribute Ids
        for (i = 0; i < Object.keys(oRunData.constantValue).length; i++) {
            var constValue = oRunData.constantValue[i];
            sEntryTypeId = constValue["EntryTypeId.Id"];
            if (entryTypeId && sEntryTypeId !== entryTypeId) {
                continue;
            }
            collectAttributeCount(constValue, sEntryTypeId);
        }
        // go through value mappings
        for (i = 0; i < Object.keys(oRunData.valueMapping.target).length; i++) {
            var target = oRunData.valueMapping.target[i];
            sEntryTypeId = target["EntryTypeId.Id"];
            if (entryTypeId && sEntryTypeId !== entryTypeId) {
                continue;
            }
            collectAttributeCount(target, sEntryTypeId);
        }

        // do the duplicate check
        var oDuplicateAttributeNamesByEntryType = {};
        var aEntryTypes = Object.keys(oEntryTypeAttributesMap);
        for (i = 0; i < aEntryTypes.length; i++) {
            sEntryTypeId = aEntryTypes[i];

            oAttributes = oEntryTypeAttributesMap[sEntryTypeId];
            aAttributes = Object.keys(oAttributes);
            for (j = 0; j < aAttributes.length; j++) {
                sAttribute = aAttributes[j];
                count = oAttributes[sAttribute];
                if (count > 1) {
                    if (oDuplicateAttributeNamesByEntryType[sEntryTypeId]) {
                        oDuplicateAttributeNamesByEntryType[sEntryTypeId].push(sAttribute);
                    } else {
                        oDuplicateAttributeNamesByEntryType[sEntryTypeId] = [ sAttribute ];
                    }
                }
            }
        }
        return oDuplicateAttributeNamesByEntryType;
    },

    /**
     * Find those event attributes which have been assigned a value of non-compatible type
     * 
     * @param oRunData
     *            the data as stored in model "RunJSONModel"
     * @param entryTypeId
     *            optional if given, do a check for assignments of the given entry type. Otherwise, do the check for all entry types of run.
     * @return a map of the form entryTypeId: array of objects of the form: {source: "", targetAttribute: "", targetAttributeType: ""}
     */
    findTypeMismatches : function(oRunData, entryTypeId) {
        var i;
        var sEntryTypeId;
        var oEntryType;

        // map of entryTypeId: (map of attrHash: attribute count)
        var oEntryTypeMismatchMap = {};

        if (entryTypeId) {
            oEntryTypeMismatchMap[entryTypeId] = [];
        } else {
            // get all entry type Ids
            for (i = 0; i < Object.keys(oRunData.entryTypes.header).length; i++) {
                oEntryType = oRunData.entryTypes.header[i];
                sEntryTypeId = oEntryType.Id;
                if (!oEntryTypeMismatchMap[sEntryTypeId]) {
                    oEntryTypeMismatchMap[sEntryTypeId] = [];
                }
            }
        }

        // visitor function to accumulate the count of an attribute
        // @param oEntity the object which might be assigned to an event attribute (e.g. annotation, constantValue, valueMappingTarget)
        function collectTypeMismatches(sourceVariable, targetAttribute, targetAttributeType, sEntryTypeId) {
            var aMismatches = oEntryTypeMismatchMap[sEntryTypeId];
            aMismatches.push({
                source : sourceVariable,
                targetAttribute : targetAttribute,
                targetAttributeType : targetAttributeType
            });
        }

        /**
         * check if the asignemnt has a mismatch, i.e. source type and target type are not compatible
         * 
         * @param sSourceType
         *            the source type, i.e. the annotation type (Integer, Timestamp, Var, IP.IP, etc.) an entity that describes a value assignment from an annotation to an event attribute (e.g.
         *            annotation, valueMappingTarget)
         * @param sTargetType
         *            the target type of an event attribute, e.g. TIMESTAMP, BIGINT, INTEGER, NVARCHAR
         * @param bStrict
         *            if true, the whole input parameter "sSourceType" is used for comparison. If false, it is sufficient if a part matches.
         * @return boolean true if a mismatch was found.
         */
        function isTypeCompatible(sSourceType, sTargetType, bStrict) {
            if (!sTargetType) {
                return true;
            }
            switch (sTargetType) {
            case "TIMESTAMP":
                return bStrict ? sSourceType === "Timestamp" || sSourceType === "Var" : sSourceType.includes("Timestamp") || sSourceType.includes("Var");
            case "BIGINT":
                return bStrict ? sSourceType === "Integer" || sSourceType === "Var" || sSourceType === "Var" : sSourceType.includes("Integer") || sSourceType.includes("Var");
            case "INTEGER":
                return bStrict ? sSourceType === "Integer" || sSourceType === "Var" || sSourceType === "Var" : sSourceType.includes("Integer") || sSourceType.includes("Var");
            case "DOUBLE":
                return bStrict ? sSourceType === "Integer" || sSourceType === "Var" || sSourceType === "Var" : sSourceType.includes("Integer") || sSourceType.includes("Var");
            default:// NVARCHAR
                return true;
            }

        }

        // curried function
        function check(oAnnotation) {
            return function(targetAttribute) {
                if (!isTypeCompatible(oAnnotation.Type, targetAttribute.dataType, true)) {
                    collectTypeMismatches(oAnnotation.VariableName, targetAttribute.displayName, targetAttribute.dataType, sEntryTypeId);
                }
            };
        }
        // go through annotations, and retrieve mismatches sorted by entry type
        for (i = 0; i < Object.keys(oRunData.entryTypes.allAnnotations).length; i++) {
            var annotation = oRunData.entryTypes.allAnnotations[i];
            sEntryTypeId = annotation["EntryTypeId.Id"];
            if (entryTypeId && sEntryTypeId !== entryTypeId) {
                continue;
            }
            if (annotation.TargetAttributeIds) {
                annotation.TargetAttributeIds.forEach(check(annotation));
            }
        }

        // go through value mappings
        for (i = 0; i < Object.keys(oRunData.valueMapping.target).length; i++) {
            var target = oRunData.valueMapping.target[i];
            sEntryTypeId = target["EntryTypeId.Id"];
            if (entryTypeId && sEntryTypeId !== entryTypeId) {
                continue;
            }
            if (!isTypeCompatible(target.TargetValue, target.attrDataType, false)) {
                collectTypeMismatches(target.TargetValue, target.attrDisplayName, target.attrDataType, sEntryTypeId);
            }
        }

        return oEntryTypeMismatchMap;
    }

};
