artifacts builderVersion:"1.1", {
    group "com.sap.etd", {
		artifact "etdui", isVariant: true, {
			  file "${gendir}/module/etdui.tgz", 
			  extension: "tar.gz"
		}
		
    }
}
