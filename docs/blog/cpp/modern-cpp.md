# Modern C++

我们在这里简单讨论 Modern C++ 的一些特性。

## [Enum](https://en.cppreference.com/w/cpp/language/enum)

### 无作用域枚举 Unscoped enum

> 接近 C 语言的枚举类型。

特性：

-   所有的 `enum` 值都以不大于 `int` 的类型存储，这个类型被称为 _底层类型_：
    -   如果不存在能够存放所有枚举项的整数类型，枚举非 _良构_。
    -   如果枚举列表为空，则底层类型被定义为一个只有 `0` 的类型。

```cpp
enum name: type {
    enumerator = constant-expression,
}
```

-   如果第一个枚举值没有指定值，那么它的值为 `0`，后续枚举值依次递增：

```cpp
enum Color {
    red, // 0
    green, // 1
    blue = 4, // 4
    gray, // 5
    black = 1, // 1
    white = red + green, // 1
};
```

-   枚举类自身的名字可以忽略，在这样的定义下，只会将所有枚举值传递给外部作用域：

```cpp
enum {
    a = 1,
    b = 2,
} // equivalent => a = 1, b = 2
```

-   枚举类定义在类中时，其枚举值可以通过类的成员函数 (方法) 访问：

```cpp
struct S {
    enum E { a, b, c };
};

S s;
S* ps = &s;
S::E e = S::a;
S::E e1 = ps->b;
S::E e2 = s.c;
S::E e3 = S::E::a; // C++11 & later
```

### 有作用域枚举 Scoped enum

特性：

-   仍然存在 _底层类型_，但是不会进行自动转换：

```cpp
enum class name: type {
    enumerator = constant-expression,
}
```
