// Copyright 2011 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

#include <string>
#include <memory>
#include <utility>
#include <vector>
#include <unordered_map>
#include <iostream>
#include <emscripten.h>

static const std::string EMPTY_ID;
static const std::string EMPTY_VALUE;
static const char *EMPTY_STR = "";

class Element {
private:
    std::string id_;
    std::string parentId;
    std::vector <std::shared_ptr<Element>> children_;
    std::unordered_map <std::string, std::string> attributes_;

public:
    explicit Element(std::string id) : id_(std::move(id)) {

    }

    [[nodiscard]] const std::string &getParentId() const {
        return parentId;
    }

    void setParentId(const std::string &parentId) {
        Element::parentId = parentId;
    }

    [[nodiscard]] std::vector <std::shared_ptr<Element>> &getChildren() {
        return children_;
    }

    [[nodiscard]] const std::string &getId() const {
        return id_;
    }

    [[nodiscard]] const std::string &getAttribute(const std::string &key) const {
        if (attributes_.count(key) == 0) {
            return EMPTY_VALUE;
        }

        return attributes_.find(key)->second;
    }

    void setAttribute(const std::string &key, const std::string &value) {
        attributes_.insert({key, value});
    }
};

static std::unordered_map <std::string, std::shared_ptr<Element>> ELEMENTS{};

void add_element(const std::string &id) {
    const auto elem = std::make_shared<Element>(id);
    ELEMENTS.insert({id, elem});
}

void set_element_attr(const std::string &id, const std::string &key, const std::string &value) {
    const auto elem_iter = ELEMENTS.find(id);
    if (elem_iter == ELEMENTS.end()) {
        return;
    }

    const auto elem = elem_iter->second;
    elem->setAttribute(key, value);
}

void append_child(const std::string &parentId, const std::string &childId) {
    const auto &parent_iter = ELEMENTS.find(parentId);
    if (parent_iter == ELEMENTS.end()) {
        return;
    }

    const auto &child_iter = ELEMENTS.find(childId);
    if (child_iter == ELEMENTS.end()) {
        return;
    }

    const auto &child = child_iter->second;
    const auto &previousParentId = child->getParentId();

    parent_iter->second->getChildren().emplace_back(child);
    child->setParentId(parentId);

    const auto &previousParent_iter = ELEMENTS.find(previousParentId);
    if (previousParent_iter == ELEMENTS.end()) {
        return;
    }
    auto &previousParentChild = previousParent_iter->second->getChildren();
    std::remove(previousParentChild.begin(), previousParentChild.end(), child);
}

const std::string &get_first_child(const std::string &parentId) {
    const auto &parent_iter = ELEMENTS.find(parentId);
    if (parent_iter == ELEMENTS.end()) {
        return EMPTY_VALUE;
    }

    const auto &children = parent_iter->second->getChildren();
    if (children.empty()) {
        return EMPTY_VALUE;
    }

    return children.at(0)->getId();
}


#ifdef __cplusplus
extern "C" {
#endif

EMSCRIPTEN_KEEPALIVE
int get_element_count() {
    return ELEMENTS.size();
}

EMSCRIPTEN_KEEPALIVE
void add_element(const char *id) {
    add_element(std::string{id});
}

EMSCRIPTEN_KEEPALIVE
void set_element_attr(const char *id, const char *attrKey, const char *value) {
    set_element_attr(std::string{id}, {attrKey}, {value});
}

EMSCRIPTEN_KEEPALIVE
const char *get_element_attr(const char *id, const char *attrKey) {
    const auto &elem_iter = ELEMENTS.find(id);
    if (elem_iter == ELEMENTS.end()) {
        return EMPTY_STR;
    }

    const auto &elem = elem_iter->second;
    return const_cast<char *>(elem->getAttribute(attrKey).c_str());
}

EMSCRIPTEN_KEEPALIVE
void append_child(const char *parentId, const char *childId) {
    append_child(std::string{parentId}, {childId});
}

EMSCRIPTEN_KEEPALIVE
const char *get_first_child(const char *parentId) {
    return const_cast<char *>(get_first_child(std::string{parentId}).c_str());
}

EMSCRIPTEN_KEEPALIVE
void clear() {
    ELEMENTS.clear();
}

EMSCRIPTEN_KEEPALIVE
void case_create_elements() {
    for (auto i = 0; i < 10000; i++) {
        auto id = "node-" + std::to_string(i);
        add_element(id);
        for (auto j = 0; j < 30; j++) {
            auto attrSeq = std::to_string(j);
            set_element_attr(id, "attr-" + attrSeq, "value-" + attrSeq);
        }
    }
}

EMSCRIPTEN_KEEPALIVE
void case_restruct_tree() {
    for (auto i = 0; i < 100; i++) {
        auto parentId = "node-" + std::to_string(i);
        for (auto j = 0; j < 99; j++) {
            auto childId = "node-" + std::to_string(i + j + 1);
            append_child(parentId, childId);
        }

        for (auto j = 0; j < 99; j++) {
            auto id = "node-" + std::to_string(j + 1);
            get_first_child(id);
        }
    }
}

#ifdef __cplusplus
}
#endif


int main() {
    return 0;
}
