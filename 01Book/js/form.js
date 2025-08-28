//전역변수
const API_BASE_URL = "http://localhost:8080";

//현재 Update 중인 도서의 ID
var editingBookId = null;

//DOM 엘리먼트 가져오기
const bookForm = document.getElementById("bookForm");
const bookTableBody = document.getElementById("bookTableBody");
const submitButton = document.querySelector("button[type='submit']");
const cancelButton = document.querySelector(".cancel-btn");
const formErrorSpan = document.getElementById("formError");

//document Load 이벤트 처리하기
document.addEventListener("DOMContentLoaded", function () {
    LoadBook();
});

//BookForm의 Submit 이벤트 처리하기
bookForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // 폼 데이터 수집
    const formData = new FormData(bookForm);
    const bookData = {
        title: formData.get('title').trim(),
        author: formData.get('author').trim(),
        isbn: formData.get('isbn').trim(),
        price: formData.get('price') ? parseInt(formData.get('price')) : null,
        publishDate: formData.get('publishDate') || null,
        detailRequest: {
            description: (formData.get('description') || "").trim(),
            language: (formData.get('language') || "").trim(),
            pageCount: formData.get('pageCount') ? parseInt(formData.get('pageCount')) : null,
            publisher: (formData.get('publisher') || "").trim(),
            coverImageUrl: (formData.get('coverImageUrl') || "").trim(),
            edition: (formData.get('edition') || "").trim()
        }
    };

    // 유효성 검사
    if (!validateBook(bookData)) {
        return;
    }

    //유효한 데이터 출력하기
    console.log(bookData);

    //현재 수정중인 학생Id가 있으면 수정처리
    if (editingBookId) {
        //서버로 Book 수정 요청하기
        updateBook(editingBookId, bookData);
    } else {
        //서버로 Book 등록 요청하기
        createBook(bookData);
    }

});

//Book 등록 함수
function createBook(bookData) {
    fetch(`${API_BASE_URL}/api/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)  //Object => json
    })
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출
                const errorData = await response.json();
                //status code와 message를 확인하기
                if (response.status === 409) {
                    //중복 오류 처리
                    throw new Error(errorData.message || '중복 되는 정보가 있습니다.');
                } else {
                    //기타 오류 처리
                    throw new Error(errorData.message || '도서 등록에 실패했습니다.')
                }
            }
            return response.json();
        })
        .then((result) => {
            showSuccess("도서가 성공적으로 등록되었습니다!");
            //입력 Form의 input의 값 초기화
            //bookForm.reset();
            resetForm();
            //목록 새로 고침
            LoadBook();
        })
        .catch((error) => {
            console.log('Error : ', error);
            showError(error.message);
        });
}//createBook

//Book 삭제 함수
function deleteBook(bookId) {
    if (!confirm(`${bookId}번 도서를 정말로 삭제하시겠습니까?`)) {
        return;
    }
    console.log('삭제처리 ...');
    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: 'DELETE'
    })
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출
                const errorData = await response.json();
                //status code와 message를 확인하기
                if (response.status === 404) {
                    //중복 오류 처리
                    throw new Error(errorData.message || '존재하지 않는 도서입니다다.');
                } else {
                    //기타 오류 처리
                    throw new Error(errorData.message || '도서 삭제에 실패했습니다.')
                }
            }
            alert("도서가 성공적으로 삭제되었습니다!");
            //목록 새로 고침
            LoadBook();
        })
}//deleteBook

//학생 수정전에 데이터를 로드하는 함수
function editBook(bookId) {
    fetch(`${API_BASE_URL}/api/books/${bookId}`)
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출
                const errorData = await response.json();
                //status code와 message를 확인하기
                if (response.status === 404) {
                    //중복 오류 처리
                    throw new Error(errorData.message || '존재하지 않는 도서입니다.');
                }
            }
            return response.json();
        })
        .then((book) => {
            //Form에 데이터 채우기
            bookForm.title.value = book.title;
            bookForm.author.value = book.author;
            bookForm.isbn.value = book.isbn;
            bookForm.price.value = book.price;
            bookForm.publishDate.value = book.publishDate;
            if (book.detail) {
                bookForm.description.value = book.detail.description;
                bookForm.language.value = book.detail.language;
                bookForm.pageCount.value = book.detail.pageCount;
                bookForm.publisher.value = book.detail.publisher;
                bookForm.coverImageUrl.value = book.detail.coverImageUrl;
                bookForm.edition.value = book.detail.edition;
            }

            //수정 Mode 설정
            editingBookId = bookId;
            //버튼의 타이틀을 등록 => 수정으로 변경
            submitButton.textContent = "도서 수정";
            //취소 버튼을 활성화
            cancelButton.style.display = 'inline-block';
        })
        .catch((error) => {
            console.log('Error : ', error);
            alert(error.message);
        });
}//editBook

//학생 수정을 처리하는 함수
function updateBook(bookId, bookData) {
    fetch(`${API_BASE_URL}/api/books/${bookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData)  //Object => json
    })
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출 
                //errorData 객체는 서버의 ErrorObject와 매핑이 된다.
                const errorData = await response.json();
                //status code와 message를 확인하기
                if (response.status === 409) {
                    //중복 오류 처리
                    throw new Error(`${errorData.message} ( 에러코드: ${errorData.statusCode} )` || '중복 되는 정보가 있습니다.');
                } else {
                    //기타 오류 처리
                    throw new Error(errorData.message || '도서 수정에 실패했습니다.')
                }
            }
            return response.json();
        })
        .then((result) => {
            alert("도서가 성공적으로 수정되었습니다!");
            //등록모드로 전환
            resetForm();
            //목록 새로 고침
            LoadBook();
        })
        .catch((error) => {
            console.log('Error : ', error);
            alert(error.message);
        });
}//updateBook

//입력필드 초기화,수정모드에서 등록모드로 전환
function resetForm() {
    //form 초기화
    bookForm.reset();
    //수정 Mode 설정하는 변수 초기화
    editingBookId = null;
    //submit 버튼의 타이틀을 학생 등록 변경
    submitButton.textContent = "도서 등록";
    //cancel 버튼의 사라지게
    cancelButton.style.display = 'none';
}//resetForm

// 도서 데이터 유효성 검사
function validateBook(book) {
    // 필수 필드 검사
    if (!book.title) {
        alert('제목을 입력해주세요.');
        return false;
    }

    if (!book.author) {
        alert('저자를 입력해주세요.');
        return false;
    }

    if (!book.isbn) {
        alert('ISBN을 입력해주세요.');
        return false;
    }

    // ISBN 형식 검사 (기본적인 영숫자 조합)
    const isbnPattern = /^[0-9X-]+$/;
    if (!isbnPattern.test(book.isbn)) {
        alert('올바른 ISBN 형식이 아닙니다. (숫자와 X, -만 허용)');
        return false;
    }

    // 가격 유효성 검사
    if (book.price !== null && book.price < 0) {
        alert('가격은 0 이상이어야 합니다.');
        return false;
    }

    // 페이지 수 유효성 검사
    if (book.detail && book.detail.pageCount != null && book.detail.pageCount < 0) {
        alert('페이지 수는 0 이상이어야 합니다.');
        return false;
    }

    // URL 형식 검사 (입력된 경우에만)
    if (book.detail && book.detail.coverImageUrl && !isValidUrl(book.detail.coverImageUrl)) {
        alert('올바른 이미지 URL 형식이 아닙니다.');
        return false;
    }

    return true;
}

// URL 유효성 검사
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

//book 목록을 Load 하는 함수
function LoadBook() {
    console.log("도서 목록 Load 중.....");
    fetch(`${API_BASE_URL}/api/books`) //Promise
        .then(async (response) => {
            if (!response.ok) {
                //응답 본문을 읽어서 에러 메시지 추출
                const errorData = await response.json();
                throw new Error(`${errorData.message}`);
            }
            return response.json();
        })
        .then((book) => renderBookTable(book))
        .catch((error) => {
            console.log(error);
            //alert(">>> 도서 목록을 불러오는데 실패했습니다!.");
            showError(error.message);
            bookTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #dc3545;">
                        오류: 데이터를 불러올 수 없습니다.
                    </td>
                </tr>
            `;
        });
};

// 도서 테이블 렌더링
function renderBookTable(books) {
    bookTableBody.innerHTML = '';

    books.forEach(book => {
        const row = document.createElement('tr');

        const formattedPrice = book.price ? `₩${book.price.toLocaleString()}` : '-';
        const formattedDate = book.publishDate || '-';
        const publisher = book.detail ? book.detail.publisher || '-' : '-';

        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td>${formattedPrice}</td>
            <td>${formattedDate}</td>
            <td>${publisher}</td>
            <td>
                <button class="edit-btn" onclick="editBook(${book.id})">수정</button>
                <button class="delete-btn" onclick="deleteBook(${book.id})">삭제</button>
            </td>
        `;

        bookTableBody.appendChild(row);
    });
}


//성공 메시지 출력
function showSuccess(message) {
    formErrorSpan.textContent = message;
    formErrorSpan.style.display = 'block';
    formErrorSpan.style.color = '#28a745';
}
//에러 메시지 출력
function showError(message) {
    formErrorSpan.textContent = message;
    formErrorSpan.style.display = 'block';
    formErrorSpan.style.color = '#dc3545';
}
//메시지 초기화
function clearMessages() {
    formErrorSpan.style.display = 'none';
}
