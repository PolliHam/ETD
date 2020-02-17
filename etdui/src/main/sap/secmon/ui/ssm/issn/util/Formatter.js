jQuery.sap.declare("sap.secmon.ui.ssm.issn.util.Formatter");

sap.secmon.ui.ssm.issn.util.Formatter =
        {

            oEnumService : new sap.secmon.ui.commons.EnumService(),

            noteNumberTitleFormatter : function(NoteNumber, NoteTitle) {
                return NoteNumber + ":" + NoteTitle;
            },

            implementationStatusFormatter : function(status) {
                var enumsModel = this.getModel("enums");
                if (enumsModel === undefined) {
                    return status;
                } else {
                    return sap.secmon.ui.ssm.issn.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.ui.ssm.issn/NoteSystemImplementation/ImplementationStatus/", status);
                }
            },

            processStatusFormatter : function(status) {
                var enumsModel = this.getModel("enums");
                if (enumsModel === undefined) {
                    return status;
                } else {
                    return sap.secmon.ui.ssm.issn.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.ui.ssm.issn/NoteSystemImplementation/ProcessStatus/", status);
                }
            },

            implementedBySPFormatter : function(implementedBySP) {
                var enumsModel = this.getModel("enums");
                if (enumsModel === undefined) {
                    return implementedBySP;
                } else {
                    return sap.secmon.ui.ssm.issn.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.ui.ssm.issn/NoteSystemImplementation/ImplementedBySP/", implementedBySP);
                }
            },

            implementationFullyAutomaticFormatter : function(implementationFullyAutomatic) {
                var enumsModel = this.getModel("enums");
                if (enumsModel === undefined) {
                    return implementationFullyAutomatic;
                } else {
                    return sap.secmon.ui.ssm.issn.util.Formatter.oEnumService.getEnumValue(enumsModel, "/sap.secmon.ui.ssm.issn/NoteSystemImplementation/ImplementationFullyAutomatic/",
                            implementationFullyAutomatic);
                }
            }

        };
