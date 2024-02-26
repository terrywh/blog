---
title: 首页
icon: bi-house
layout: default
---

# {{site.time}}

{% for post in site.posts %}

* [{{post.title}}]({{post.url}}) <small class="text-secondary">[{{post.date  | date: "%Y-%m-%d"}}]</small>

{% endfor %}
