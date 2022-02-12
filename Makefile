index.html: main.cpp
	emcc main.cpp \
		-s WASM=1 \
		-s EXPORTED_FUNCTIONS=_add_element,_get_element_count,_get_element_attr,_set_element_attr,_append_child,_main,_get_first_child,_clear,_case_create_elements,_free,_case_restruct_tree \
		-s EXPORTED_RUNTIME_METHODS=ccall,cwrap,stringToUTF8,UTF8ToString \
		--post-js post.js \
		-o index.html \
		-s ALLOW_MEMORY_GROWTH=1 \
		-s INITIAL_MEMORY=536870912 \
		-O3

all: index.html

start: index.html
	yarn
	echo 'Serving http://localhost:8080, check the console output for benchmark result'
	node server.js
